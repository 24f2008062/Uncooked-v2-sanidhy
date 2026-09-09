import { readFileSync } from "node:fs";
import pg from "pg";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  let v = line.slice(i + 1).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  env[line.slice(0, i)] = v;
}

const client = new pg.Client({
  connectionString: env.DIRECT_URL || env.DATABASE_URL,
  ssl: { rejectUnauthorized: env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true" },
  connectionTimeoutMillis: 20000,
});

await client.connect();

const count = await client.query('SELECT COUNT(*)::int AS c FROM "Notification"');
console.log("existing Notification rows", count.rows[0].c);

// Legacy table shape (userId/message/type/read) conflicts with new inbox model.
// Replace with the approved schema. Recipients cascade from Notification.
await client.query(`
  DROP TABLE IF EXISTS "NotificationRecipient" CASCADE;
  DROP TABLE IF EXISTS "Notification" CASCADE;

  CREATE TABLE "Notification" (
    "id" TEXT PRIMARY KEY,
    "broadcastId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'ANNOUNCEMENT',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
  CREATE INDEX "Notification_broadcastId_idx" ON "Notification"("broadcastId");

  CREATE TABLE "NotificationRecipient" (
    "id" TEXT PRIMARY KEY,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationRecipient_notificationId_fkey"
      FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NotificationRecipient_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
  );
  CREATE UNIQUE INDEX "NotificationRecipient_notificationId_userId_key"
    ON "NotificationRecipient"("notificationId", "userId");
  CREATE INDEX "NotificationRecipient_userId_readAt_createdAt_idx"
    ON "NotificationRecipient"("userId", "readAt", "createdAt");
`);

console.log("OK migrated to inbox Notification schema");
await client.end();
