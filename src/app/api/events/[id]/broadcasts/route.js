import { after } from "next/server";
import { jsonOk, jsonError, safeError, readJson } from "@/server/http/envelope";
import { requireUser, enforceMutationGuards } from "@/server/http/guards";
import {
  assertEventBroadcastAccess,
  createEventBroadcast,
  listEventAttendeeUserIds,
  listEventBroadcasts,
} from "@/server/services/eventBroadcast";
import { createInAppNotificationForUserIds } from "@/server/services/notifications";

export async function GET(req, { params }) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;

    const { id: eventId } = await params;
    const access = await assertEventBroadcastAccess(auth.user, eventId, { write: false });

    const { searchParams } = new URL(req.url);
    const items = await listEventBroadcasts(eventId, {
      limit: searchParams.get("limit"),
      cursor: searchParams.get("cursor"),
    });

    return jsonOk({
      eventId,
      eventTitle: access.event.title,
      canWrite: access.canWrite,
      items,
    });
  } catch (error) {
    if (error?.status === 404) {
      return jsonError(error.message || "Event not found", 404, error.code || "NOT_FOUND");
    }
    return safeError(error, "Unable to load event broadcasts");
  }
}

export async function POST(req, { params }) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;

    const { id: eventId } = await params;
    const blocked = await enforceMutationGuards(req, {
      rateKey: `rl_event_broadcast:${eventId}`,
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });
    if (blocked) return blocked;

    const access = await assertEventBroadcastAccess(auth.user, eventId, { write: true });

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;

    const notifyAttendees = parsed.body?.notifyAttendees !== false;
    let bulletin;
    try {
      bulletin = await createEventBroadcast({
        eventId,
        authorId: auth.user.id,
        title: parsed.body?.title,
        content: parsed.body?.content,
        mediaUrl: parsed.body?.mediaUrl,
      });
    } catch (e) {
      if (e?.code === "VALIDATION_ERROR") {
        return jsonError(e.message, 400, "VALIDATION_ERROR");
      }
      throw e;
    }

    if (notifyAttendees) {
      after(async () => {
        try {
          const userIds = await listEventAttendeeUserIds(eventId, {
            excludeUserId: auth.user.id,
          });
          await createInAppNotificationForUserIds({
            userIds,
            title: `${access.event.title}: ${bulletin.title}`,
            body: bulletin.content,
            mediaUrl: bulletin.mediaUrl,
            kind: "EVENT_UPDATE",
            createdById: auth.user.id,
          });
        } catch (err) {
          console.error("[EventBroadcast] notification fan-out failed:", err.message);
        }
      });
    }

    return jsonOk({ item: bulletin, canWrite: true }, 201);
  } catch (error) {
    if (error?.status === 404) {
      return jsonError(error.message || "Event not found", 404, error.code || "NOT_FOUND");
    }
    return safeError(error, "Unable to post event broadcast");
  }
}
