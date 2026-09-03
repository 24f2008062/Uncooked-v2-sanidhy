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
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        applications: {
          take: 50,
          include: {
            user: { select: { id: true, fullName: true, email: true, department: true } },
          },
          orderBy: { appliedAt: "desc" },
        },
        _count: { select: { applications: true } },
      },
    });

    if (!opportunity) return jsonError("Opportunity not found", 404);

    return jsonOk({ opportunity });
  } catch (error) {
    return safeError(error, "Unable to fetch opportunity details");
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

    const existing = await prisma.opportunity.findUnique({ where: { id } });
    if (!existing) return jsonError("Opportunity not found", 404);

    const updateData = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.company !== undefined) updateData.company = body.company;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.stipend !== undefined) updateData.stipend = body.stipend;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.requirements !== undefined) updateData.requirements = body.requirements;
    if (body.deadline !== undefined) updateData.deadline = body.deadline ? new Date(body.deadline) : null;
    if (body.status !== undefined) updateData.status = body.status;

    const updated = await prisma.opportunity.update({
      where: { id },
      data: updateData,
    });

    await logAuditEvent({
      action: "ADMIN_OPPORTUNITY_UPDATE",
      actorId: auth.user.id,
      entityType: "Opportunity",
      entityId: id,
      previousStatus: existing.status,
      newStatus: updated.status,
      ipHash: hashIp(getClientIp(req)),
    });

    return jsonOk({ opportunity: updated, message: "Opportunity updated successfully." });
  } catch (error) {
    return safeError(error, "Unable to update opportunity");
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { id } = await params;

    const existing = await prisma.opportunity.findUnique({ where: { id } });
    if (!existing) return jsonError("Opportunity not found", 404);

    await prisma.opportunity.delete({ where: { id } });

    await logAuditEvent({
      action: "ADMIN_OPPORTUNITY_DELETE",
      actorId: auth.user.id,
      entityType: "Opportunity",
      entityId: id,
      ipHash: hashIp(getClientIp(req)),
      metadata: { title: existing.title, company: existing.company },
    });

    return jsonOk({ message: "Opportunity deleted successfully." });
  } catch (error) {
    return safeError(error, "Unable to delete opportunity");
  }
}
