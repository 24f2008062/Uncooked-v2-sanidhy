import prisma from "@/lib/prisma";
import { jsonError, jsonOk, safeError } from "@/server/http/envelope";
import { getCurrentUser } from "@/server/auth/authentication";
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
      },
    });

    if (!event) {
      return jsonError("Event not found", 404, "NOT_FOUND");
    }

    let myRegistration = null;
    const user = await getCurrentUser();
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
    });
  } catch (error) {
    return safeError(error, "Unable to load event");
  }
}
