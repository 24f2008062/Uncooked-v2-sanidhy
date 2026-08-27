import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const { eventId, userId, teamName, couponCode } = body;

    if (!eventId || !userId) {
      return NextResponse.json(
        { error: "Event ID and User ID are required" },
        { status: 400 }
      );
    }

    // 1. Verify Event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { registrations: true } } },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // 2. Check if user is already registered
    const existingRegistration = await prisma.registration.findFirst({
      where: { eventId, userId },
    });

    if (existingRegistration) {
      return NextResponse.json(
        {
          message: "User is already registered for this event",
          registration: existingRegistration,
        },
        { status: 200 }
      );
    }

    // 3. Determine status based on capacity
    const currentCount = event._count?.registrations || 0;
    const isFull = currentCount >= event.capacity;
    const status = isFull && event.waitlistEnabled ? "Waitlisted" : "Confirmed";

    // 4. Create Registration in database
    const registration = await prisma.registration.create({
      data: {
        eventId,
        userId,
        teamName: teamName || null,
        status,
        checkInStatus: false,
      },
    });

    return NextResponse.json(
      {
        message: status === "Waitlisted" ? "Added to event waitlist" : "Registration confirmed",
        registrationId: registration.id,
        status: registration.status,
        ticketPass: {
          id: registration.id,
          eventId: event.id,
          eventTitle: event.title,
          eventDate: event.date,
          location: event.location,
          qrPayload: JSON.stringify({
            regId: registration.id,
            eventId: event.id,
            userId: userId,
            sig: registration.id.slice(0, 8),
          }),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error during registration" },
      { status: 500 }
    );
  }
}
