import { jsonOk, jsonError, safeError, readJson } from "@/server/http/envelope";
import { requireUser, enforceMutationGuards } from "@/server/http/guards";
import { markNotificationsRead } from "@/server/services/notifications";

export async function POST(req) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;

    const blocked = await enforceMutationGuards(req, {
      rateKey: "rl_notifications_read",
      limit: 60,
      windowMs: 60_000,
    });
    if (blocked) return blocked;

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;

    const all = Boolean(parsed.body?.all);
    const ids = Array.isArray(parsed.body?.ids) ? parsed.body.ids : [];
    if (!all && ids.length === 0) {
      return jsonError("Provide ids or all:true", 400, "VALIDATION_ERROR");
    }

    const data = await markNotificationsRead(auth.user.id, { ids, all });
    return jsonOk(data);
  } catch (error) {
    return safeError(error, "Unable to update notifications");
  }
}
