import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson, safeError } from "@/server/http/envelope";
import { enforceMutationGuards, requireUser } from "@/server/http/guards";
import { getEventHostAccess } from "@/server/auth/eventHost";
import { isValidEventId } from "@/server/services/eventsPublic";
import { logAuditEvent } from "@/server/auth/audit";
import { getClientIp, hashIp } from "@/server/http/ip";

/**
 * GET /api/events/[id]/subhosts
 * List sub-hosts / check-in staff assigned to the event.
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
      select: { id: true, createdById: true, archived: true, status: true },
    });
    if (!event || event.archived || event.status === "Suspended") {
      return jsonError("Event not found", 404, "NOT_FOUND");
    }

    const access = await getEventHostAccess(event, auth.user);
    if (!access.allowed) {
      return jsonError("Only the event host or assigned staff can view sub-hosts.", 403, "FORBIDDEN");
    }

    const subHosts = await prisma.eventSubHost.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            fullName: true,
            email: true,
            department: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const mapped = subHosts.map((sh) => ({
      id: sh.id,
      userId: sh.userId,
      role: sh.role,
      createdAt: sh.createdAt,
      name: sh.user?.fullName || sh.user?.name || "Staff Member",
      email: sh.user?.email || "",
      department: sh.user?.department || "",
    }));

    return jsonOk({
      eventId,
      subHosts: mapped,
      isCreator: access.isCreator,
    });
  } catch (error) {
    return safeError(error, "Unable to list sub-hosts");
  }
}

/**
 * POST /api/events/[id]/subhosts
 * Assign a user as a sub-host / staff member by email.
 * Authz: Event creator or SUPER_ADMIN.
 */
export async function POST(req, { params }) {
  try {
    const blocked = await enforceMutationGuards(req, {
      rateKey: "rl_event_subhost_assign",
      limit: 30,
      windowMs: 60_000,
    });
    if (blocked) return blocked;

    const auth = await requireUser();
    if (auth.error) return auth.error;

    const { id: eventId } = await params;
    if (!isValidEventId(eventId)) {
      return jsonError("Event not found", 404, "NOT_FOUND");
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, createdById: true, archived: true, status: true },
    });
    if (!event || event.archived || event.status === "Suspended") {
      return jsonError("Event not found", 404, "NOT_FOUND");
    }

    const access = await getEventHostAccess(event, auth.user);
    if (!access.isCreator) {
      return jsonError("Only the event creator or an admin can assign sub-hosts.", 403, "FORBIDDEN");
    }

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;
    const body = parsed.body || {};

    const rawEmail = String(body.email || "").trim().toLowerCase();
    const role = String(body.role || "SUB_HOST").trim().toUpperCase() === "CHECKIN_STAFF" ? "CHECKIN_STAFF" : "SUB_HOST";

    if (!rawEmail || !rawEmail.includes("@")) {
      return jsonError("A valid user email is required to assign a sub-host.", 400);
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: rawEmail },
      select: { id: true, name: true, fullName: true, email: true, department: true, disabledAt: true, deletedAt: true },
    });

    if (!targetUser || targetUser.deletedAt || targetUser.disabledAt) {
      return jsonError(`User with email "${rawEmail}" not found on Opportia.`, 404, "USER_NOT_FOUND");
    }

    if (event.createdById && event.createdById === targetUser.id) {
      return jsonError("This user is already the primary creator/host of the event.", 400, "ALREADY_PRIMARY_HOST");
    }

    const existing = await prisma.eventSubHost.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: targetUser.id,
        },
      },
    });

    if (existing) {
      return jsonError("User is already assigned as a sub-host for this event.", 409, "ALREADY_ASSIGNED");
    }

    const subHost = await prisma.eventSubHost.create({
      data: {
        eventId,
        userId: targetUser.id,
        role,
      },
    });

    await logAuditEvent({
      actorId: auth.user.id,
      action: "SUB_HOST_ASSIGN",
      entityType: "EventSubHost",
      entityId: subHost.id,
      eventId,
      ipHash: hashIp(getClientIp(req)),
      metadata: { targetUserId: targetUser.id, targetEmail: targetUser.email, role },
    });

    return jsonOk({
      message: "Sub-host assigned successfully",
      subHost: {
        id: subHost.id,
        userId: targetUser.id,
        role: subHost.role,
        createdAt: subHost.createdAt,
        name: targetUser.fullName || targetUser.name || "Staff Member",
        email: targetUser.email,
        department: targetUser.department || "",
      },
    });
  } catch (error) {
    return safeError(error, "Unable to assign sub-host");
  }
}

/**
 * DELETE /api/events/[id]/subhosts
 * Remove an assigned sub-host from the event.
 * Authz: Event creator, SUPER_ADMIN, or the sub-host removing themselves.
 */
export async function DELETE(req, { params }) {
  try {
    const blocked = await enforceMutationGuards(req, {
      rateKey: "rl_event_subhost_remove",
      limit: 30,
      windowMs: 60_000,
    });
    if (blocked) return blocked;

    const auth = await requireUser();
    if (auth.error) return auth.error;

    const { id: eventId } = await params;
    if (!isValidEventId(eventId)) {
      return jsonError("Event not found", 404, "NOT_FOUND");
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, createdById: true, archived: true, status: true },
    });
    if (!event || event.archived || event.status === "Suspended") {
      return jsonError("Event not found", 404, "NOT_FOUND");
    }

    const access = await getEventHostAccess(event, auth.user);

    const parsed = await readJson(req);
    const body = parsed.body || {};
    const { searchParams } = new URL(req.url);
    const targetUserId = String(body.userId || searchParams.get("userId") || "").trim();

    if (!targetUserId) {
      return jsonError("userId is required to remove a sub-host.", 400);
    }

    const isSelfRemoval = auth.user.id === targetUserId;
    if (!access.isCreator && !isSelfRemoval) {
      return jsonError("Only the event creator or the assigned member themselves can remove this role.", 403, "FORBIDDEN");
    }

    const existing = await prisma.eventSubHost.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: targetUserId,
        },
      },
    });

    if (!existing) {
      return jsonError("Sub-host assignment not found.", 404, "NOT_FOUND");
    }

    await prisma.eventSubHost.delete({
      where: { id: existing.id },
    });

    await logAuditEvent({
      actorId: auth.user.id,
      action: "SUB_HOST_REMOVE",
      entityType: "EventSubHost",
      entityId: existing.id,
      eventId,
      ipHash: hashIp(getClientIp(req)),
      metadata: { targetUserId },
    });

    return jsonOk({
      message: "Sub-host removed successfully",
      removedUserId: targetUserId,
    });
  } catch (error) {
    return safeError(error, "Unable to remove sub-host");
  }
}

