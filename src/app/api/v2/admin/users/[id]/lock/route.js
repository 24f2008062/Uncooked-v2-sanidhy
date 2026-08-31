import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson, safeError } from "@/server/http/envelope";
import { enforceMutationGuards, requireSuperAdmin } from "@/server/http/guards";
import { logAuditEvent } from "@/server/auth/audit";
import { getClientIp, hashIp } from "@/server/http/ip";

export async function POST(req, { params }) {
  try {
    const blocked = await enforceMutationGuards(req, { rateKey: "rl_admin", limit: 30, windowMs: 60 * 1000 });
    if (blocked) return blocked;

    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { id } = await params;
    if (id === auth.user.id) {
      return jsonError("You cannot lock your own account", 400, "INVALID_STATE");
    }

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;
    const body = parsed.body;
    const lock = Boolean(body.lock);
    const hours = Math.min(Math.max(parseInt(body.hours, 10) || 24, 1), 168);
    const lockedUntil = lock ? new Date(Date.now() + hours * 3600 * 1000) : null;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        lockedUntil,
        failedLoginAttempts: lock ? 8 : 0,
        tokenVersion: lock ? { increment: 1 } : undefined,
      },
    });

    await logAuditEvent({
      action: lock ? "ACCOUNT_LOCK" : "ACCOUNT_UNLOCK",
      actorId: auth.user.id,
      entityType: "User",
      entityId: id,
      ipHash: hashIp(getClientIp(req)),
      metadata: { lockedUntil, hours },
    });

    return jsonOk({
      message: lock ? "Account locked" : "Account unlocked",
      lockedUntil: updatedUser.lockedUntil,
    });
  } catch (error) {
    return safeError(error, "Unable to update lock state");
  }
}
