import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const whereClause = {};

    if (category && category !== "All") {
      whereClause.category = { equals: category, mode: "insensitive" };
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      take: limit,
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ events, count: events.length });
  } catch (error) {
    console.error("Error fetching events:", error.message || error);
    if (error.message?.includes("Can't reach database server") || error.code === "P1001") {
      return NextResponse.json(
        { error: "Database server connection failed. Please check DATABASE_URL in .env.local", events: [], count: 0 },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch events from database", events: [], count: 0 },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { title, type, category, date, location, description, price, capacity, ticketType } = body;

    if (!title || !type || !date || !location) {
      return NextResponse.json(
        { error: "Missing required fields (title, type, date, location)" },
        { status: 400 }
      );
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const eventId = `${slug}-${Date.now().toString(36)}`;

    const event = await prisma.event.create({
      data: {
        id: eventId,
        title,
        type,
        category: category || type,
        date: new Date(date),
        location,
        description: description || "",
        ticketType: ticketType || (price > 0 ? "Paid" : "Free"),
        price: price ? parseFloat(price) : 0,
        capacity: capacity ? parseInt(capacity, 10) : 100,
      },
    });

    return NextResponse.json({ message: "Event created successfully", event }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error.message || error);
    if (error.message?.includes("Can't reach database server") || error.code === "P1001") {
      return NextResponse.json(
        { error: "Database server connection failed. Please check DATABASE_URL in .env.local" },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
