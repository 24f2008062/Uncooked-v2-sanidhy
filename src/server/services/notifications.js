import prisma from "@/lib/prisma";
import { safeHttpsUrl } from "@/server/security/html";

const TITLE_MAX = 200;
const BODY_MAX = 5000;
const MEDIA_MAX = 500;
const INSERT_BATCH = 100;

export function sanitizeNotificationPayload({ title, body, mediaUrl, kind = "ANNOUNCEMENT" }) {
  const cleanTitle = String(title || "").trim().slice(0, TITLE_MAX);
  const cleanBody = String(body || "").trim().slice(0, BODY_MAX);
  let cleanMedia = null;
  if (mediaUrl) {
    const safe = safeHttpsUrl(String(mediaUrl).trim().slice(0, MEDIA_MAX));
    cleanMedia = safe || null;
  }
  const cleanKind = ["ANNOUNCEMENT", "SYSTEM"].includes(String(kind).toUpperCase())
    ? String(kind).toUpperCase()
    : "ANNOUNCEMENT";
  if (!cleanTitle || !cleanBody) {
    throw new Error("Notification title and body are required");
  }
  return { title: cleanTitle, body: cleanBody, mediaUrl: cleanMedia, kind: cleanKind };
}

/**
 * Create one notification and fan-out recipient rows for active users by email.
 * Idempotent per (notificationId, userId) via unique constraint + skipDuplicates.
 */
export async function createInAppNotificationForEmails({
  emails,
  title,
  body,
  mediaUrl,
  kind = "ANNOUNCEMENT",
  broadcastId = null,
  createdById = null,
}) {
  const payload = sanitizeNotificationPayload({ title, body, mediaUrl, kind });
  const uniqueEmails = [
    ...new Set(
      (emails || [])
        .map((e) => String(e || "").trim().toLowerCase())
        .filter(Boolean)
    ),
  ];
  if (uniqueEmails.length === 0) {
    return { notification: null, recipientCount: 0 };
  }

  const users = await prisma.user.findMany({
    where: {
      email: { in: uniqueEmails },
      deletedAt: null,
      disabledAt: null,
    },
    select: { id: true, email: true },
  });
  if (users.length === 0) {
    return { notification: null, recipientCount: 0 };
  }

  const notification = await prisma.notification.create({
    data: {
      broadcastId: broadcastId || null,
      title: payload.title,
      body: payload.body,
      mediaUrl: payload.mediaUrl,
      kind: payload.kind,
      createdById: createdById || null,
    },
  });

  for (let i = 0; i < users.length; i += INSERT_BATCH) {
    const chunk = users.slice(i, i + INSERT_BATCH);
    await prisma.notificationRecipient.createMany({
      data: chunk.map((u) => ({
        notificationId: notification.id,
        userId: u.id,
      })),
      skipDuplicates: true,
    });
  }

  return { notification, recipientCount: users.length };
}

export async function listNotificationsForUser(userId, { limit = 20, cursor } = {}) {
  const take = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const where = {
    userId,
    user: { deletedAt: null },
    ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
  };

  const [rows, unreadCount] = await Promise.all([
    prisma.notificationRecipient.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        readAt: true,
        createdAt: true,
        notification: {
          select: {
            id: true,
            title: true,
            body: true,
            mediaUrl: true,
            kind: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.notificationRecipient.count({
      where: { userId, readAt: null, user: { deletedAt: null } },
    }),
  ]);

  return {
    unreadCount,
    items: rows.map((r) => ({
      id: r.id,
      readAt: r.readAt,
      createdAt: r.createdAt,
      title: r.notification.title,
      body: r.notification.body,
      mediaUrl: r.notification.mediaUrl,
      kind: r.notification.kind,
      notificationId: r.notification.id,
    })),
  };
}

export async function markNotificationsRead(userId, { ids, all = false } = {}) {
  if (all) {
    const result = await prisma.notificationRecipient.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }

  const cleanIds = [...new Set((ids || []).map((id) => String(id || "").trim()).filter(Boolean))].slice(
    0,
    50
  );
  if (cleanIds.length === 0) {
    return { updated: 0 };
  }

  const result = await prisma.notificationRecipient.updateMany({
    where: { userId, id: { in: cleanIds }, readAt: null },
    data: { readAt: new Date() },
  });
  return { updated: result.count };
}
