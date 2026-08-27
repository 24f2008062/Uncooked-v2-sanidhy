import { jsonOk, safeError } from "@/server/http/envelope";
import { enforceMutationGuards, requireUser } from "@/server/http/guards";
import { eraseUser } from "@/server/services/erasure";
import { getClientIp, hashIp } from "@/server/http/ip";

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
