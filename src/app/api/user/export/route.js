import prisma from "@/lib/prisma";
import { jsonError, jsonOk, safeError } from "@/server/http/envelope";
import { requireUser } from "@/server/http/guards";
import { exportUserPayload } from "@/server/services/erasure";
import { logAuditEvent } from "@/server/auth/audit";
import { getClientIp, hashIp } from "@/server/http/ip";
import { rateLimit, rateLimitHeaders } from "@/server/http/rateLimit";

export async function GET(req) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;

    const rl = rateLimit(`rl_user_export:${auth.user.id}`, 5, 60 * 60 * 1000);
    if (!rl.ok) {
      return jsonError("Too many export requests. Please try again later.", 429, "RATE_LIMITED", rateLimitHeaders(rl));
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      include: {
        registrations: { include: { event: true } },
        hostApplication: true,
        opportunityApps: { include: { opportunity: true } },
        consents: true,
      },
    });

    if (!user) {
      return jsonError("User not found", 404, "NOT_FOUND");
    }

    await logAuditEvent({
      actorId: auth.user.id,
      action: "USER_EXPORT",
      entityType: "User",
      entityId: auth.user.id,
      ipHash: hashIp(getClientIp(req)),
    });

    return jsonOk({ export: exportUserPayload(user) });
  } catch (error) {
    return safeError(error, "Unable to export your data");
  }
}
