import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson, safeError } from "@/server/http/envelope";
import { enforceMutationGuards, requireSuperAdmin } from "@/server/http/guards";
import { logAuditEvent } from "@/server/auth/audit";
import { getClientIp, hashIp } from "@/server/http/ip";

const ACTIONS = {
  APPROVE: "APPROVED",
  REJECT: "REJECTED",
  INFO: "INFO_REQUESTED",
};

export async function POST(req, { params }) {
  try {
    const blocked = await enforceMutationGuards(req, { rateKey: "rl_admin", limit: 30, windowMs: 60 * 1000 });
    if (blocked) return blocked;

    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { id } = await params;
    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;
    const body = parsed.body;
    const action = String(body.action || "").toUpperCase();
    const newStatus = ACTIONS[action];
    if (!newStatus) {
      return jsonError("Action must be APPROVE, REJECT, or INFO", 400);
    }

    const application = await prisma.hostApplication.findUnique({ where: { id } });
    if (!application) {
      return jsonError("Host application not found", 404, "NOT_FOUND");
    }

    const updatedApp = await prisma.$transaction(async (tx) => {
      const app = await tx.hostApplication.update({
        where: { id },
        data: {
          status: newStatus,
          reviewedAt: new Date(),
          reviewedBy: auth.user.id,
          ...(body.notes !== undefined && { notes: String(body.notes).slice(0, 2000) }),
          ...(body.rejectionReason !== undefined && {
            rejectionReason: String(body.rejectionReason).slice(0, 500),
          }),
        },
      });

      if (newStatus === "APPROVED") {
        await tx.user.update({
          where: { id: application.userId },
          data: { role: "ORGANIZER", tokenVersion: { increment: 1 } },
        });
      }

      return app;
    });

    await logAuditEvent({
      action: newStatus === "APPROVED" ? "KYC_APPROVAL" : "KYC_REJECTION",
      actorId: auth.user.id,
      entityType: "HostApplication",
      entityId: id,
      applicationId: id,
      previousStatus: application.status,
      newStatus,
      ipHash: hashIp(getClientIp(req)),
    });

    return jsonOk({
      message: `Host application ${newStatus}`,
      application: updatedApp,
    });
  } catch (error) {
    return safeError(error, "Unable to review application");
  }
}
