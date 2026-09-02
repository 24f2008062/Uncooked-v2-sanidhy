import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson, safeError } from "@/server/http/envelope";
import { getClientIp, hashIp } from "@/server/http/ip";
import { rateLimitAsync, rateLimitHeaders } from "@/server/http/rateLimit";
import { enforceMutationGuards, requireRoles } from "@/server/http/guards";

function publicOpportunity(row) {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    type: row.type,
    location: row.location,
    stipend: row.stipend,
    description: row.description,
    deadline: row.deadline,
    status: row.status,
    createdAt: row.createdAt,
  };
}

export async function GET(req) {
  try {
    const rl = await rateLimitAsync(`rl_opp_get:${hashIp(getClientIp(req))}`, 60, 60_000);
    if (!rl.ok) {
      return jsonError("Too many requests. Please try again later.", 429, "RATE_LIMITED", rateLimitHeaders(rl));
    }
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const whereClause = { status: "ACTIVE" };

    if (type && type !== "All") {
      whereClause.type = { equals: type, mode: "insensitive" };
    }

    const opportunities = await prisma.opportunity.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return jsonOk({ opportunities: opportunities.map(publicOpportunity), count: opportunities.length });
  } catch (error) {
    return safeError(error, "Unable to load opportunities");
  }
}

export async function POST(req) {
  try {
    const blocked = await enforceMutationGuards(req, { rateKey: "rl_opp_create", limit: 10, windowMs: 60 * 60 * 1000 });
    if (blocked) return blocked;

    const auth = await requireRoles(["ORGANIZER"]);
    if (auth.error) return auth.error;

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;
    const body = parsed.body;
    const title = String(body.title || "").trim().slice(0, 140);
    const company = String(body.company || "").trim().slice(0, 120);
    const type = String(body.type || "").trim().slice(0, 40);
    const location = String(body.location || "Remote").trim().slice(0, 80);
    const stipend = String(body.stipend || "").trim().slice(0, 80);
    const description = String(body.description || "").trim().slice(0, 5000);

    if (!title || !company || !type || !description) {
      return jsonError("Title, company, type, and description are required", 400);
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        title,
        company,
        type,
        location,
        stipend: stipend || null,
        description,
        createdById: auth.user.id,
      },
    });

    return jsonOk({ message: "Opportunity posted", opportunity: publicOpportunity(opportunity) }, 201);
  } catch (error) {
    return safeError(error, "Unable to create opportunity");
  }
}
