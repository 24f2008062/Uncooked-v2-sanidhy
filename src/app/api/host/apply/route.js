import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson, safeError } from "@/server/http/envelope";
import { enforceMutationGuards, requireUser } from "@/server/http/guards";
import { logAuditEvent } from "@/server/auth/audit";
import { getClientIp, hashIp } from "@/server/http/ip";

const ORG_TYPES = new Set(["College Club", "NGO", "Company", "University", "Independent", "Other"]);

export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;

    const application = await prisma.hostApplication.findUnique({
      where: { userId: auth.user.id },
      select: {
        id: true,
        organizationName: true,
        organizationType: true,
        status: true,
        notes: true,
        rejectionReason: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return jsonOk({ application });
  } catch (error) {
    return safeError(error, "Unable to load host application");
  }
}

export async function POST(req) {
  try {
    const blocked = await enforceMutationGuards(req, { rateKey: "rl_host_apply", limit: 5, windowMs: 60 * 60 * 1000 });
    if (blocked) return blocked;

    const auth = await requireUser();
    if (auth.error) return auth.error;

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;
    const body = parsed.body;
    const organizationName = String(body.organizationName || "").trim().slice(0, 120);
    const organizationType = String(body.organizationType || "").trim();
    const notes = String(body.notes || "").trim().slice(0, 2000);

    if (!organizationName || !ORG_TYPES.has(organizationType)) {
      return jsonError("Organization name and a valid organization type are required", 400);
    }

    const existing = await prisma.hostApplication.findUnique({ where: { userId: auth.user.id } });
    if (existing && existing.status === "APPROVED") {
      return jsonError("You are already a verified host.", 409, "CONFLICT");
    }

    const application = await prisma.hostApplication.upsert({
      where: { userId: auth.user.id },
      update: {
        organizationName,
        organizationType,
        notes: notes || null,
        documentUrls: null,
        status: "PENDING",
        rejectionReason: null,
      },
      create: {
        userId: auth.user.id,
        organizationName,
        organizationType,
        notes: notes || null,
        status: "PENDING",
      },
    });

    await logAuditEvent({
      actorId: auth.user.id,
      action: "HOST_APPLY",
      entityType: "HostApplication",
      entityId: application.id,
      applicationId: application.id,
      ipHash: hashIp(getClientIp(req)),
    });

    return jsonOk({
      message: "Host application submitted. An administrator will review it.",
      applicationId: application.id,
      status: application.status,
    }, 201);
  } catch (error) {
    return safeError(error, "Unable to submit host application");
  }
}
