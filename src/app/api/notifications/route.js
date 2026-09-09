import { jsonOk, jsonError, safeError } from "@/server/http/envelope";
import { requireUser } from "@/server/http/guards";
import { listNotificationsForUser } from "@/server/services/notifications";

export async function GET(req) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit");
    const cursor = searchParams.get("cursor");
    const data = await listNotificationsForUser(auth.user.id, { limit, cursor });
    return jsonOk(data);
  } catch (error) {
    return safeError(error, "Unable to load notifications");
  }
}
