import prisma from "@/lib/prisma";
import { isSuperAdmin } from "@/server/auth/authorization";
import { safeHttpsUrl } from "@/server/security/html";
import { isValidEventId } from "@/server/services/eventsPublic";

const TITLE_MAX = 200;
const CONTENT_MAX = 5000;
const READ_STATUSES = ["Confirmed", "Pending", "Waitlisted"];

export function sanitizeBulletinPayload({ title, content, mediaUrl }) {
  const cleanTitle = String(title || "").trim().slice(0, TITLE_MAX);
  const cleanContent = String(content || "").trim().slice(0, CONTENT_MAX);
  let cleanMedia = null;
  if (mediaUrl) {
    cleanMedia = safeHttpsUrl(String(mediaUrl).trim().slice(0, 500));
  }
  if (!cleanTitle || !cleanContent) {
    const err = new Error("Title and content are required");
    err.code = "VALIDATION_ERROR";
    throw err;
  }
  return { title: cleanTitle, content: cleanContent, mediaUrl: cleanMedia };
}

export async function loadEventOrNull(eventId) {
  if (!eventId || !isValidEventId(eventId)) return null;
  return prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      createdById: true,
      archived: true,
      status: true,
    },
  });
}

export function isEventHost(user, event) {
  if (!user || !event) return false;
  if (isSuperAdmin(user)) return true;
  return Boolean(event.createdById && event.createdById === user.id);
}

export async function isEventMember(userId, eventId) {
  if (!userId || !eventId) return false;
  const reg = await prisma.registration.findUnique({
    where: { userId_eventId: { userId, eventId } },
    select: { status: true },
  });
  if (!reg) return false;
  return READ_STATUSES.includes(String(reg.status));
}

/**
 * Reader: host, SUPER_ADMIN, or registered attendee.
 * Returns { event, canWrite } or throws with .status / .code
 */
export async function assertEventBroadcastAccess(user, eventId, { write = false } = {}) {
  const event = await loadEventOrNull(eventId);
  if (!event || event.archived || event.status === "Suspended") {
    const err = new Error("Event not found");
    err.status = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  const host = isEventHost(user, event);
  if (write) {
    if (!host) {
      const err = new Error("Event not found");
      err.status = 404;
      err.code = "NOT_FOUND";
      throw err;
    }
    return { event, canWrite: true };
  }

  if (host) return { event, canWrite: true };
  const member = await isEventMember(user.id, eventId);
  if (!member) {
    const err = new Error("Event not found");
    err.status = 404;
    err.code = "NOT_FOUND";
    throw err;
  }
  return { event, canWrite: false };
}

export async function listEventBroadcasts(eventId, { limit = 30, cursor } = {}) {
  const take = Math.min(Math.max(Number(limit) || 30, 1), 50);
  return prisma.bulletinUpdate.findMany({
    where: {
      eventId,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      title: true,
      content: true,
      mediaUrl: true,
      authorId: true,
      createdAt: true,
    },
  });
}

export async function createEventBroadcast({
  eventId,
  authorId,
  title,
  content,
  mediaUrl,
}) {
  const payload = sanitizeBulletinPayload({ title, content, mediaUrl });
  return prisma.bulletinUpdate.create({
    data: {
      eventId,
      authorId: authorId || null,
      title: payload.title,
      content: payload.content,
      mediaUrl: payload.mediaUrl,
    },
    select: {
      id: true,
      title: true,
      content: true,
      mediaUrl: true,
      authorId: true,
      createdAt: true,
    },
  });
}

/** Registered attendees (excluding host) for bell fan-out. */
export async function listEventAttendeeUserIds(eventId, { excludeUserId } = {}) {
  const regs = await prisma.registration.findMany({
    where: {
      eventId,
      status: { in: READ_STATUSES },
      ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
      user: { deletedAt: null, disabledAt: null },
    },
    select: { userId: true },
    take: 2000,
  });
  return [...new Set(regs.map((r) => r.userId))];
}
