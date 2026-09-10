import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson, safeError } from "@/server/http/envelope";
import { enforceMutationGuards, requireUser } from "@/server/http/guards";
import { isSuperAdmin } from "@/server/auth/authorization";
import { verifyTicketPayload } from "@/server/tickets/hmac";
import { isValidEventId } from "@/server/services/eventsPublic";
import { logAuditEvent } from "@/server/auth/audit";
import { getClientIp, hashIp } from "@/server/http/ip";

/**
 * GET /api/events/[id]/check-in
 * Fetch attendee roster and live check-in statistics for host scanner.
 * Authz: event creator (ORGANIZER) or SUPER_ADMIN.
 */
export async function GET(req, { params }) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;

    const { id: eventId } = await params;
    if (!isValidEventId(eventId)) {
      return jsonError("Event not found", 404, "NOT_FOUND");
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        date: true,
        capacity: true,
        location: true,
        city: true,
        createdById: true,
        archived: true,
        status: true,
      },
    });

    if (!event || event.archived || event.status === "Suspended") {
      return jsonError("Event not found", 404, "NOT_FOUND");
    }

    const allowed =
      isSuperAdmin(auth.user) ||
      (String(auth.user.role).toUpperCase() === "ORGANIZER" && event.createdById === auth.user.id);
    if (!allowed) {
      return jsonError("Only the event host or an admin can access door scanner data.", 403, "FORBIDDEN");
    }

    const registrations = await prisma.registration.findMany({
      where: { eventId },
      include: {
        user: {
          select: { id: true, name: true, fullName: true, email: true, department: true },
        },
      },
      orderBy: [{ checkInStatus: "desc" }, { registeredAt: "asc" }],
    });

    const total = registrations.length;
    const checkedIn = registrations.filter((r) => r.checkInStatus).length;
    const pending = Math.max(0, total - checkedIn);
    const percentage = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

    const attendees = registrations.map((r) => ({
      id: r.id,
      userId: r.userId,
      name: r.user?.fullName || r.user?.name || "Guest",
      email: r.user?.email || "",
      department: r.user?.department || "",
      registeredAt: r.registeredAt,
      checkInStatus: Boolean(r.checkInStatus),
      status: r.status,
      updatedAt: r.updatedAt,
    }));

    return jsonOk({
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        capacity: event.capacity,
        location: event.location,
        city: event.city,
      },
      stats: {
        total,
        checkedIn,
        pending,
        capacity: event.capacity,
        percentage,
      },
      attendees,
    });
  } catch (error) {
    return safeError(error, "Unable to fetch attendee list for check-in");
  }
}

/**
 * Door scanner: verify HMAC pass or manual host check-in and mark registration checked in.
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
    if (!registrationId) {
      return jsonError("registrationId is required", 400);
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

    const registration = await prisma.registration.findFirst({
      where: { id: registrationId, eventId },
      include: { user: { select: { id: true, name: true, fullName: true, email: true, department: true } } },
    });
    if (!registration) {
      return jsonError("Registration not found for this event.", 404, "NOT_FOUND");
    }

    // Handle Undo Check-In Action
    if (body.action === "undo") {
      const updated = await prisma.registration.update({
        where: { id: registration.id },
        data: { checkInStatus: false, status: "Confirmed" },
      });

      await logAuditEvent({
        actorId: auth.user.id,
        action: "CHECK_IN_UNDO",
        entityType: "Registration",
        entityId: updated.id,
        eventId,
        ipHash: hashIp(getClientIp(req)),
        newStatus: "Confirmed",
      });

      return jsonOk({
        undone: true,
        registrationId: updated.id,
        guestName: registration.user?.fullName || registration.user?.name || "Guest",
        guestEmail: registration.user?.email || "",
        eventTitle: event.title,
      });
    }

    // Handle Manual Host Check-In
    if (body.manual === true) {
      if (registration.status === "Cancelled") {
        return jsonError("This registration was cancelled.", 409, "INVALID_STATE");
      }
      if (registration.checkInStatus) {
        return jsonOk({
          alreadyCheckedIn: true,
          registrationId: registration.id,
          guestName: registration.user?.fullName || registration.user?.name || "Guest",
          guestEmail: registration.user?.email || "",
          eventTitle: event.title,
        });
      }

      const updated = await prisma.registration.update({
        where: { id: registration.id },
        data: { checkInStatus: true, status: "CheckedIn" },
      });

      await logAuditEvent({
        actorId: auth.user.id,
        action: "CHECK_IN_MANUAL",
        entityType: "Registration",
        entityId: updated.id,
        eventId,
        ipHash: hashIp(getClientIp(req)),
        newStatus: "CheckedIn",
      });

      return jsonOk({
        alreadyCheckedIn: false,
        registrationId: updated.id,
        guestName: registration.user?.fullName || registration.user?.name || "Guest",
        guestEmail: registration.user?.email || "",
        eventTitle: event.title,
        checkedInAt: new Date().toISOString(),
      });
    }

    // Standard QR Code Scan Verification with HMAC
    const userId = String(body.userId || registration.userId || "").trim();
    const sig = String(body.sig || "").trim();

    if (!userId || !sig) {
      return jsonError("registrationId, userId, and sig are required for QR code verification", 400);
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

    if (registration.status === "Cancelled") {
      return jsonError("This registration was cancelled.", 409, "INVALID_STATE");
    }

    if (registration.checkInStatus) {
      return jsonOk({
        alreadyCheckedIn: true,
        registrationId: registration.id,
        guestName: registration.user?.fullName || registration.user?.name || "Guest",
        guestEmail: registration.user?.email || "",
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
      guestName: registration.user?.fullName || registration.user?.name || "Guest",
      guestEmail: registration.user?.email || "",
      eventTitle: event.title,
      checkedInAt: new Date().toISOString(),
    });
  } catch (error) {
    return safeError(error, "Unable to check in guest");
  }
}
