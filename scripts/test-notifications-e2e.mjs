/**
 * Local/integration smoke for in-app notifications against the configured DB.
 * Requires schema pushed (Notification tables) and .env.local.
 */
import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import prisma from "../src/lib/prisma.js";
import {
  createInAppNotificationForEmails,
  listNotificationsForUser,
  markNotificationsRead,
  sanitizeNotificationPayload,
} from "../src/server/services/notifications.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  console.log("--- sanitize ---");
  const bad = (() => {
    try {
      sanitizeNotificationPayload({ title: "", body: "x" });
      return false;
    } catch {
      return true;
    }
  })();
  assert(bad, "empty title should throw");

  console.log("--- db tables ---");
  try {
    await prisma.$queryRaw`SELECT 1 FROM "Notification" LIMIT 1`;
    await prisma.$queryRaw`SELECT 1 FROM "NotificationRecipient" LIMIT 1`;
    console.log("tables present");
  } catch (e) {
    console.error("SCHEMA_MISSING:", e.message);
    console.error("Run: npx prisma db push  (with DIRECT_URL to session/direct Postgres)");
    process.exit(2);
  }

  const user = await prisma.user.findFirst({
    where: { deletedAt: null, disabledAt: null },
    select: { id: true, email: true },
    orderBy: { createdAt: "desc" },
  });
  assert(user?.email, "need at least one active user in DB");
  console.log("using user", user.email);

  const title = `E2E Notify ${Date.now()}`;
  const { notification, recipientCount } = await createInAppNotificationForEmails({
    emails: [user.email, "nobody-does-not-exist@example.invalid"],
    title,
    body: "Team announcement body for e2e test.",
    mediaUrl: "http://evil.example/x.png",
    createdById: user.id,
  });
  assert(notification?.id, "notification created");
  assert(recipientCount === 1, `expected 1 recipient got ${recipientCount}`);
  assert(notification.mediaUrl === null, "non-https media rejected");

  const listed = await listNotificationsForUser(user.id, { limit: 10 });
  assert(listed.unreadCount >= 1, "unreadCount >= 1");
  const hit = listed.items.find((i) => i.notificationId === notification.id);
  assert(hit, "notification appears in inbox");
  assert(!hit.readAt, "new item unread");

  const other = await prisma.user.findFirst({
    where: { deletedAt: null, id: { not: user.id } },
    select: { id: true },
  });
  if (other) {
    const otherList = await listNotificationsForUser(other.id, { limit: 50 });
    assert(
      !otherList.items.some((i) => i.notificationId === notification.id),
      "other user must not see this notification"
    );
    console.log("IDOR isolation OK");
  }

  const marked = await markNotificationsRead(user.id, { ids: [hit.id] });
  assert(marked.updated === 1, "mark one updated 1");
  const after = await listNotificationsForUser(user.id, { limit: 10 });
  const hit2 = after.items.find((i) => i.id === hit.id);
  assert(hit2?.readAt, "item marked read");

  const markedAgain = await markNotificationsRead(user.id, { ids: [hit.id] });
  assert(markedAgain.updated === 0, "idempotent mark-read");

  const all = await markNotificationsRead(user.id, { all: true });
  console.log("mark all updated", all.updated);

  // cleanup test notification
  await prisma.notification.delete({ where: { id: notification.id } });
  console.log("PASS notifications e2e");
}

main()
  .catch((e) => {
    console.error("FAIL", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
