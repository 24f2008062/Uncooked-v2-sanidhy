import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson, safeError } from "@/server/http/envelope";
import { enforceMutationGuards, requireUser } from "@/server/http/guards";
import { eraseUser } from "@/server/services/erasure";
import { getClientIp, hashIp } from "@/server/http/ip";
import { verifyPassword } from "@/server/utils/passwordUtils";

export async function POST(req) {
  try {
    const blocked = await enforceMutationGuards(req, {
      rateKey: "rl_user_delete",
      limit: 3,
      windowMs: 60 * 60 * 1000,
    });
    if (blocked) return blocked;

    const auth = await requireUser();
    if (auth.error) return auth.error;

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;
    const password = parsed.body.password;
    if (!password || typeof password !== "string") {
      return jsonError("Current password is required to erase your account.", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { id: true, passwordHash: true },
    });
    if (!user?.passwordHash) {
      return jsonError("Unable to verify account ownership.", 400, "INVALID_STATE");
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return jsonError("Incorrect password.", 403, "FORBIDDEN");
    }

    await eraseUser(auth.user.id, {
      actorId: auth.user.id,
      ipHash: hashIp(getClientIp(req)),
    });

    return jsonOk({
      message: "Your account and personal data have been erased. Session credentials are no longer valid.",
    });
  } catch (error) {
    return safeError(error, "Unable to erase account");
  }
}
