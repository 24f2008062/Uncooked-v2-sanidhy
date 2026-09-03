import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson, safeError } from "@/server/http/envelope";
import { requireSuperAdmin } from "@/server/http/guards";
import { logAuditEvent } from "@/server/auth/audit";
import { getClientIp, hashIp } from "@/server/http/ip";

export async function GET(req, { params }) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { id } = await params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, email: true, fullName: true, role: true } },
        registrations: {
          take: 50,
          include: {
            user: { select: { id: true, fullName: true, email: true, department: true } },
          },
          orderBy: { registeredAt: "desc" },
        },
        ticketTiers: true,
        _count: { select: { registrations: true } },
      },
    });

    if (!event) return jsonError("Event not found", 404);

    return jsonOk({ event });
  } catch (error) {
    return safeError(error, "Unable to fetch event details");
  }
}

export async function PATCH(req, { params }) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { id } = await params;
    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;
    const body = parsed.body;

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) return jsonError("Event not found", 404);

    const updateData = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.date !== undefined) updateData.date = new Date(body.date);
    if (body.capacity !== undefined) updateData.capacity = parseInt(body.capacity, 10);
    if (body.ticketType !== undefined) updateData.ticketType = body.ticketType;
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.bannerUrl !== undefined) updateData.bannerUrl = body.bannerUrl;
    if (body.prizePool !== undefined) updateData.prizePool = body.prizePool;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.archived !== undefined) updateData.archived = Boolean(body.archived);

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    await logAuditEvent({
      action: "ADMIN_EVENT_UPDATE",
      actorId: auth.user.id,
      entityType: "Event",
      entityId: id,
      previousStatus: existing.status,
      newStatus: updatedEvent.status,
      ipHash: hashIp(getClientIp(req)),
    });

    return jsonOk({ event: updatedEvent, message: "Event updated successfully." });
  } catch (error) {
    return safeError(error, "Unable to update event");
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { id } = await params;

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) return jsonError("Event not found", 404);

    await prisma.event.delete({ where: { id } });

    await logAuditEvent({
      action: "ADMIN_EVENT_DELETE",
      actorId: auth.user.id,
      entityType: "Event",
      entityId: id,
      ipHash: hashIp(getClientIp(req)),
      metadata: { title: existing.title },
    });

    return jsonOk({ message: "Event deleted successfully." });
  } catch (error) {
    return safeError(error, "Unable to delete event");
  }
}
