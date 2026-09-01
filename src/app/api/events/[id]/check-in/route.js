import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson, safeError } from "@/server/http/envelope";
import { enforceMutationGuards, requireUser } from "@/server/http/guards";
import { isSuperAdmin } from "@/server/auth/authorization";
import { verifyTicketPayload } from "@/server/tickets/hmac";
import { isValidEventId } from "@/server/services/eventsPublic";
import { logAuditEvent } from "@/server/auth/audit";
import { getClientIp, hashIp } from "@/server/http/ip";

/**
 * Door scanner: verify HMAC pass and mark registration checked in.
 * Authz: event creator (ORGANIZER) or SUPER_ADMIN.
 */
export async function POST(req, { params }) {
  try {
    const blocked = await enforceMutationGuards(req, {
      rateKey: "rl_checkin",
      limit: 120,
      windowMs: 60_000,
    });
    if (blocked) return blocked;

    const auth = await requireUser();
    if (auth.error) return auth.error;

    const { id: eventId } = await params;
    if (!isValidEventId(eventId)) {
      return jsonError("Event not found", 404, "NOT_FOUND");
    }

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;
    const body = parsed.body;

    const registrationId = String(body.registrationId || body.regId || "").trim();
    const userId = String(body.userId || "").trim();
    const sig = String(body.sig || "").trim();

    if (!registrationId || !userId || !sig) {
      return jsonError("registrationId, userId, and sig are required", 400);
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, createdById: true, archived: true, status: true },
    });
    if (!event || event.archived || event.status === "Suspended") {
      return jsonError("Event not found", 404, "NOT_FOUND");
    }

    const allowed =
      isSuperAdmin(auth.user) ||
      (String(auth.user.role).toUpperCase() === "ORGANIZER" && event.createdById === auth.user.id);
    if (!allowed) {
      return jsonError("Only the event host or an admin can check guests in.", 403, "FORBIDDEN");
    }

    const valid = verifyTicketPayload({
      registrationId,
      eventId,
      userId,
      sig,
    });
    if (!valid) {
      return jsonError("Invalid or tampered pass signature.", 400, "INVALID_TICKET");
    }

    const registration = await prisma.registration.findFirst({
      where: { id: registrationId, eventId, userId },
      include: { user: { select: { name: true, fullName: true, email: true } } },
    });
    if (!registration) {
      return jsonError("Registration not found for this event.", 404, "NOT_FOUND");
    }
    if (registration.status === "Cancelled") {
      return jsonError("This registration was cancelled.", 409, "INVALID_STATE");
    }
    if (registration.checkInStatus) {
      return jsonOk({
        alreadyCheckedIn: true,
        registrationId: registration.id,
        guestName: registration.user.fullName || registration.user.name || "Guest",
        eventTitle: event.title,
      });
    }

    const updated = await prisma.registration.update({
      where: { id: registration.id },
      data: { checkInStatus: true, status: "CheckedIn" },
    });

    await logAuditEvent({
      actorId: auth.user.id,
      action: "CHECK_IN",
      entityType: "Registration",
      entityId: updated.id,
      eventId,
      ipHash: hashIp(getClientIp(req)),
      newStatus: "CheckedIn",
    });

    return jsonOk({
      alreadyCheckedIn: false,
      registrationId: updated.id,
      guestName: registration.user.fullName || registration.user.name || "Guest",
      eventTitle: event.title,
      checkedInAt: new Date().toISOString(),
    });
  } catch (error) {
    return safeError(error, "Unable to check in guest");
  }
}
