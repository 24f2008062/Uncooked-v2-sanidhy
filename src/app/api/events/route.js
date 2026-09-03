import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson, safeError } from "@/server/http/envelope";
import { enforceMutationGuards, requireRoles } from "@/server/http/guards";
import { logAuditEvent } from "@/server/auth/audit";
import { hashIp, getClientIp } from "@/server/http/ip";
import { rateLimitAsync, rateLimitHeaders } from "@/server/http/rateLimit";
import { publicEvent } from "@/server/services/eventsPublic";

export async function GET(req) {
  try {
    const rl = await rateLimitAsync(`rl_events_get:${hashIp(getClientIp(req))}`, 60, 60_000);
    if (!rl.ok) {
      return jsonError("Too many requests. Please try again later.", 429, "RATE_LIMITED", rateLimitHeaders(rl));
    }
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10) || 50, 1), 50);

    const whereClause = {
      archived: false,
      status: { not: "Suspended" },
    };

    // Trust catalog: only events created by verified organisers / admins
    if (String(process.env.VERIFIED_HOSTS_ONLY || "").toLowerCase() === "true") {
      whereClause.createdBy = { role: { in: ["ORGANIZER", "SUPER_ADMIN"] } };
    }

    if (category && category !== "All") {
      whereClause.category = { equals: category, mode: "insensitive" };
    }

    if (search) {
      const q = search.slice(0, 80);
      whereClause.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ];
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      take: limit,
      orderBy: { date: "asc" },
      include: {
        _count: { select: { registrations: true } },
        createdBy: { select: { name: true, fullName: true, role: true } },
      },
    });

    return jsonOk({
      events: events.map((event) => publicEvent(event, { registrationCount: event._count.registrations })),
      count: events.length,
    });
  } catch (error) {
    return safeError(error, "Unable to load events");
  }
}

export async function POST(req) {
  try {
    const blocked = await enforceMutationGuards(req, { rateKey: "rl_event_create", limit: 10, windowMs: 60 * 60 * 1000 });
    if (blocked) return blocked;

    const auth = await requireRoles(["ORGANIZER"]);
    if (auth.error) return auth.error;

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;
    const body = parsed.body;
    const title = String(body.title || "").trim().slice(0, 140);
    const type = String(body.type || body.category || "").trim().slice(0, 60);
    const category = String(body.category || type).trim().slice(0, 60);
    const location = String(body.location || "").trim().slice(0, 160);
    const description = String(body.description || "").trim().slice(0, 5000);
    const date = body.date ? new Date(body.date) : null;

    if (!title || !type || !location || !date || Number.isNaN(date.getTime())) {
      return jsonError("Title, category, date, and location are required", 400);
    }

    const unlimited = Boolean(body.unlimitedCapacity);
    const capacity = unlimited
      ? 20000
      : Math.min(Math.max(parseInt(body.capacity, 10) || 100, 1), 20000);
    const price = Math.max(parseFloat(body.price) || 0, 0);
    const ticketType = body.ticketType === "Paid" || price > 0 ? "Paid" : "Free";
    const waitlistEnabled = Boolean(body.waitlistEnabled);
    const endDate = body.endDate ? new Date(body.endDate) : null;
    const schedule =
      endDate && !Number.isNaN(endDate.getTime())
        ? JSON.stringify({ end: endDate.toISOString() })
        : null;

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 48);
    const eventId = `${slug}-${Date.now().toString(36)}`;

    const event = await prisma.event.create({
      data: {
        id: eventId,
        title,
        type,
        category,
        date,
        location,
        description,
        schedule,
        ticketType,
        price: ticketType === "Paid" ? price : 0,
        capacity,
        waitlistEnabled,
        createdById: auth.user.id,
        status: "Active",
      },
    });

    await logAuditEvent({
      actorId: auth.user.id,
      action: "EVENT_CREATE",
      entityType: "Event",
      entityId: event.id,
      ipHash: hashIp(getClientIp(req)),
    });

    return jsonOk({ message: "Event created", event: publicEvent(event) }, 201);
  } catch (error) {
    return safeError(error, "Unable to create event");
  }
}
