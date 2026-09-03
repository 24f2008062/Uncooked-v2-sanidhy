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
    const type = searchParams.get("type") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const validSortFields = ["createdAt", "title", "company", "type", "status"];
    const orderField = validSortFields.includes(sortBy) ? sortBy : "createdAt";

    const opportunities = await prisma.opportunity.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(type ? { type } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { company: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { location: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        _count: { select: { applications: true } },
      },
      orderBy: { [orderField]: sortOrder },
      take: 100,
    });

    return jsonOk({ opportunities });
  } catch (error) {
    return safeError(error, "Unable to fetch opportunities");
  }
}

export async function POST(req) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;
    const body = parsed.body;

    if (!body.title || !body.company || !body.description) {
      return jsonError("Title, company, and description are required fields.", 400);
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        title: body.title,
        company: body.company,
        type: body.type || "INTERNSHIP",
        location: body.location || "Remote",
        stipend: body.stipend || null,
        description: body.description,
        requirements: body.requirements || null,
        deadline: body.deadline ? new Date(body.deadline) : null,
        status: body.status || "ACTIVE",
        createdById: auth.user.id,
      },
    });

    await logAuditEvent({
      action: "ADMIN_OPPORTUNITY_CREATE",
      actorId: auth.user.id,
      entityType: "Opportunity",
      entityId: opportunity.id,
      ipHash: hashIp(getClientIp(req)),
      metadata: { title: opportunity.title, company: opportunity.company },
    });

    return jsonOk({ opportunity, message: "Opportunity created successfully." });
  } catch (error) {
    return safeError(error, "Unable to create opportunity");
  }
}
