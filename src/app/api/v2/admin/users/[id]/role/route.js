import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson, safeError } from "@/server/http/envelope";
import { enforceMutationGuards, requireSuperAdmin } from "@/server/http/guards";
import { logAuditEvent } from "@/server/auth/audit";
import { getClientIp, hashIp } from "@/server/http/ip";
import { ASSIGNABLE_ROLES } from "@/server/config/legal";

export async function POST(req, { params }) {
  try {
    const blocked = await enforceMutationGuards(req, { rateKey: "rl_admin", limit: 30, windowMs: 60 * 1000 });
    if (blocked) return blocked;

    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { id } = await params;
    if (id === auth.user.id) {
      return jsonError("You cannot change your own role", 400, "INVALID_STATE");
    }

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;
    const body = parsed.body;
    const role = String(body.role || "").toUpperCase();
    if (!ASSIGNABLE_ROLES.includes(role)) {
      return jsonError("Role must be USER or ORGANIZER. SUPER_ADMIN cannot be granted from this console.", 400);
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser || targetUser.deletedAt) {
      return jsonError("Target user not found", 404, "NOT_FOUND");
    }
    if (targetUser.role === "SUPER_ADMIN") {
      return jsonError("Super admin roles cannot be changed from this console.", 403, "FORBIDDEN");
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        role,
        tokenVersion: { increment: 1 },
      },
    });

    await logAuditEvent({
      action: "ROLE_CHANGE",
      actorId: auth.user.id,
      entityType: "User",
      entityId: id,
      previousStatus: targetUser.role,
      newStatus: role,
      ipHash: hashIp(getClientIp(req)),
    });

    return jsonOk({
      message: "Role updated. The user must sign in again.",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    return safeError(error, "Unable to update role");
  }
}
