import prisma from "@/lib/prisma";
import { jsonError, jsonOk, safeError } from "@/server/http/envelope";
import { getCurrentUser } from "@/server/auth/authentication";
import { isSuperAdmin } from "@/server/auth/authorization";
import { isValidEventId, publicEvent } from "@/server/services/eventsPublic";
import { signTicketPayload } from "@/server/tickets/hmac";

export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    if (!isValidEventId(id)) {
      return jsonError("Event not found", 404, "NOT_FOUND");
    }

    const event = await prisma.event.findFirst({
      where: {
        id,
        archived: false,
        status: { not: "Suspended" },
      },
      include: {
        _count: { select: { registrations: true } },
        createdBy: { select: { name: true, fullName: true } },
        createdBy: { select: { id: true, name: true, fullName: true } },
      },
    });

    if (!event) {
      return jsonError("Event not found", 404, "NOT_FOUND");
    }

    let myRegistration = null;
    const user = await getCurrentUser();
    const isHost = Boolean(
      user && (
        isSuperAdmin(user) ||
        (event.createdById && event.createdById === user.id)
      )
    );

    let hostDashboard = null;
    if (isHost) {
      const [checkedInCount, attendees] = await Promise.all([
        prisma.registration.count({
          where: { eventId: id, checkInStatus: true },
        }),
        prisma.registration.findMany({
          where: { eventId: id },
          take: 100,
          orderBy: { registeredAt: "desc" },
          select: {
            id: true,
            status: true,
            checkInStatus: true,
            registeredAt: true,
            user: {
              select: {
                id: true,
                name: true,
                fullName: true,
                email: true,
              },
            },
          },
        }),
      ]);

      hostDashboard = {
        totalRegistrations: event._count.registrations,
        checkedInCount,
        capacity: event.capacity,
        spotsLeft: Math.max(0, event.capacity - event._count.registrations),
        attendees: attendees.map((att) => ({
          id: att.id,
          status: att.status,
          checkInStatus: att.checkInStatus,
          registeredAt: att.registeredAt,
          name: att.user?.fullName || att.user?.name || "Attendee",
          email: att.user?.email || null,
        })),
      };
    }

    if (user) {
      const reg = await prisma.registration.findUnique({
        where: { userId_eventId: { userId: user.id, eventId: id } },
      });
      if (reg) {
        myRegistration = {
          id: reg.id,
          status: reg.status,
          registeredAt: reg.registeredAt,
          ticketPass: {
            id: reg.id,
            eventId: reg.eventId,
            qrPayload: JSON.stringify({
              regId: reg.id,
              eventId: reg.eventId,
              userId: user.id,
              sig: signTicketPayload({
                registrationId: reg.id,
                eventId: reg.eventId,
                userId: user.id,
              }),
            }),
          },
        };
      }
    }

    return jsonOk({
      event: publicEvent(event, { registrationCount: event._count.registrations }),
      myRegistration,
      isHost,
      hostDashboard,
    });
  } catch (error) {
    return safeError(error, "Unable to load event");
  }
}
