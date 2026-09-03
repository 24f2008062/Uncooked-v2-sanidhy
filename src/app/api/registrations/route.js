import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson, safeError } from "@/server/http/envelope";
import { enforceMutationGuards, requireUser } from "@/server/http/guards";
import { signTicketPayload } from "@/server/tickets/hmac";
import { isValidEventId } from "@/server/services/eventsPublic";

export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;

    const registrations = await prisma.registration.findMany({
      where: { userId: auth.user.id },
      include: { event: true },
      orderBy: { registeredAt: "desc" },
    });

    return jsonOk({
      registrations: registrations.map((reg) => ({
        id: reg.id,
        status: reg.status,
        registeredAt: reg.registeredAt,
        event: {
          id: reg.event.id,
          title: reg.event.title,
          date: reg.event.date,
          location: reg.event.location,
        },
        ticketPass: {
          id: reg.id,
          eventId: reg.eventId,
          qrPayload: JSON.stringify({
            regId: reg.id,
            eventId: reg.eventId,
            userId: auth.user.id,
            sig: signTicketPayload({
              registrationId: reg.id,
              eventId: reg.eventId,
              userId: auth.user.id,
            }),
          }),
        },
      })),
    });
  } catch (error) {
    return safeError(error, "Unable to load registrations");
  }
}

export async function POST(req) {
  try {
    const blocked = await enforceMutationGuards(req, { rateKey: "rl_register_event", limit: 20, windowMs: 60 * 60 * 1000 });
    if (blocked) return blocked;

    const auth = await requireUser();
    if (auth.error) return auth.error;

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;
    const body = parsed.body;
    const eventId = String(body.eventId || "").trim();
    const ticketTierId = String(body.ticketTierId || "").trim() || null;
    const teamName = String(body.teamName || "").trim().slice(0, 80) || null;

    if (!eventId || !isValidEventId(eventId)) {
      return jsonError("Event ID is required", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Serialize capacity checks across concurrent registrations for this event.
      await tx.$executeRaw`SELECT id FROM "Event" WHERE id = ${eventId} FOR UPDATE`;

      const event = await tx.event.findUnique({
        where: { id: eventId },
        include: { _count: { select: { registrations: true } } },
      });
      if (!event || event.archived || event.status === "Suspended") {
        return { error: { message: "Event not found or unavailable", status: 404, code: "NOT_FOUND" } };
      }

      const existing = await tx.registration.findUnique({
        where: { userId_eventId: { userId: auth.user.id, eventId } },
      });
      if (existing) {
        return { existing, event };
      }

      let tier = null;
      if (ticketTierId) {
        await tx.$executeRaw`SELECT id FROM "TicketTier" WHERE id = ${ticketTierId} FOR UPDATE`;
        tier = await tx.ticketTier.findUnique({ where: { id: ticketTierId } });
        if (!tier || tier.eventId !== eventId) {
          return { error: { message: "Selected ticket tier is invalid for this event", status: 400, code: "INVALID_TIER" } };
        }
        if (tier.available <= 0) {
          return { error: { message: "Selected ticket tier is sold out", status: 409, code: "TIER_SOLD_OUT" } };
        }
      }

      const currentCount = event._count?.registrations || 0;
      const isFull = currentCount >= event.capacity;
      if (isFull && !event.waitlistEnabled) {
        return { error: { message: "This event is full", status: 409, code: "CAPACITY_FULL" } };
      }
      const status = isFull ? "Waitlisted" : "Confirmed";

      const registration = await tx.registration.create({
        data: {
          eventId,
          userId: auth.user.id,
          ticketTierId: tier ? tier.id : null,
          teamName,
          status,
          checkInStatus: false,
        },
      });

      if (tier && status === "Confirmed") {
        await tx.ticketTier.update({
          where: { id: tier.id },
          data: { available: { decrement: 1 } },
        });
      }

      return { registration, event };
    });

    if (result.error) {
      return jsonError(result.error.message, result.error.status, result.error.code);
    }

    const registration = result.registration || result.existing;
    const sig = signTicketPayload({
      registrationId: registration.id,
      eventId: result.event.id,
      userId: auth.user.id,
    });

    return jsonOk({
      message: registration.status === "Waitlisted" ? "Added to waitlist" : "Registration confirmed",
      registrationId: registration.id,
      status: registration.status,
      ticketPass: {
        id: registration.id,
        eventId: result.event.id,
        eventTitle: result.event.title,
        eventDate: result.event.date,
        location: result.event.location,
        qrPayload: JSON.stringify({
          regId: registration.id,
          eventId: result.event.id,
          userId: auth.user.id,
          sig,
        }),
      },
    }, result.existing ? 200 : 201);
  } catch (error) {
    return safeError(error, "Unable to complete registration");
  }
}
