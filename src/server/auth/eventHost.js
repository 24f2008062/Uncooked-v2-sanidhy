import prisma from "@/lib/prisma";
import { isSuperAdmin } from "@/server/auth/authorization";

/**
 * Determine the user's host/management permissions for a specific event.
 *
 * @param {string|{ id: string, createdById?: string|null, subHosts?: Array<{ userId: string, role?: string }> }} eventOrId
 * @param {{ id: string, role?: string }|null} user
 * @returns {Promise<{ allowed: boolean, isHost: boolean, isCreator: boolean, isSubHost: boolean, role: string|null }>}
 */
export async function getEventHostAccess(eventOrId, user) {
  if (!user || !user.id) {
    return { allowed: false, isHost: false, isCreator: false, isSubHost: false, role: null };
  }

  if (isSuperAdmin(user)) {
    return { allowed: true, isHost: true, isCreator: true, isSubHost: false, role: "SUPER_ADMIN" };
  }

  let event = typeof eventOrId === "object" && eventOrId !== null ? eventOrId : null;
  const eventId = typeof eventOrId === "string" ? eventOrId : event?.id;

  if (!eventId) {
    return { allowed: false, isHost: false, isCreator: false, isSubHost: false, role: null };
  }

  if (!event || event.createdById === undefined) {
    event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, createdById: true },
    });
  }

  if (!event) {
    return { allowed: false, isHost: false, isCreator: false, isSubHost: false, role: null };
  }

  if (event.createdById && event.createdById === user.id) {
    return { allowed: true, isHost: true, isCreator: true, isSubHost: false, role: "CREATOR" };
  }

  // Check sub-host assignment in database or pre-loaded relation
  if (Array.isArray(event.subHosts)) {
    const match = event.subHosts.find((sh) => sh.userId === user.id);
    if (match) {
      return { allowed: true, isHost: true, isCreator: false, isSubHost: true, role: match.role || "SUB_HOST" };
    }
  }

  try {
    const subHost = await prisma.eventSubHost.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: user.id,
        },
      },
      select: { role: true },
    });

    if (subHost) {
      return { allowed: true, isHost: true, isCreator: false, isSubHost: true, role: subHost.role || "SUB_HOST" };
    }
  } catch (err) {
    console.warn("[eventHost] Error checking sub-host:", err?.message || err);
  }

  return { allowed: false, isHost: false, isCreator: false, isSubHost: false, role: null };
}

