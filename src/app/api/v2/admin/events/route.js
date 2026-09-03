import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson, safeError } from "@/server/http/envelope";
import { requireSuperAdmin } from "@/server/http/guards";
import { logAuditEvent } from "@/server/auth/audit";
import { getClientIp, hashIp } from "@/server/http/ip";

export async function GET(req) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").slice(0, 80);
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const validSortFields = ["createdAt", "title", "date", "capacity", "status"];
    const orderField = validSortFields.includes(sortBy) ? sortBy : "createdAt";

    const events = await prisma.event.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(category ? { category } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { location: { contains: search, mode: "insensitive" } },
                { city: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        createdBy: {
          select: { id: true, email: true, fullName: true, role: true },
        },
        _count: {
          select: { registrations: true, ticketTiers: true },
        },
      },
      orderBy: { [orderField]: sortOrder },
      take: 100,
    });

    return jsonOk({ events });
  } catch (error) {
    return safeError(error, "Unable to fetch events");
  }
}

export async function POST(req) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;
    const body = parsed.body;

    if (!body.title || !body.location || !body.date) {
      return jsonError("Title, location, and date are required fields.", 400);
    }

    const eventId = body.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const event = await prisma.event.create({
      data: {
        id: eventId,
        title: body.title,
        type: body.type || "General",
        category: body.category || "Campus",
        description: body.description || "",
        location: body.location,
        city: body.city || "Lucknow",
        state: body.state || "Uttar Pradesh",
        country: body.country || "India",
        date: new Date(body.date),
        capacity: parseInt(body.capacity || "100", 10),
        ticketType: body.ticketType || "Free",
        price: body.price ? parseFloat(body.price) : 0,
        bannerUrl: body.bannerUrl || null,
        prizePool: body.prizePool || null,
        status: body.status || "Active",
        archived: Boolean(body.archived),
        createdById: auth.user.id,
      },
    });

    await logAuditEvent({
      action: "ADMIN_EVENT_CREATE",
      actorId: auth.user.id,
      entityType: "Event",
      entityId: event.id,
      ipHash: hashIp(getClientIp(req)),
      metadata: { title: event.title, status: event.status },
    });

    return jsonOk({ event, message: "Event created successfully." });
  } catch (error) {
    return safeError(error, "Unable to create event");
  }
}
