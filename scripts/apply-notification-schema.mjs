import { readFileSync } from "node:fs";
import pg from "pg";

function loadEnv() {
  const out = {};
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
    out[line.slice(0, i)] = v;
  }
  return out;
}

const env = loadEnv();
const url = env.DIRECT_URL || env.DATABASE_URL;
if (!url) {
  console.error("No DATABASE_URL/DIRECT_URL");
  process.exit(1);
}

const sql = `
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT PRIMARY KEY,
  "broadcastId" TEXT,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "mediaUrl" TEXT,
  "kind" TEXT NOT NULL DEFAULT 'ANNOUNCEMENT',
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "broadcastId" TEXT;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "body" TEXT;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "mediaUrl" TEXT;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "kind" TEXT DEFAULT 'ANNOUNCEMENT';
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "createdById" TEXT;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX IF NOT EXISTS "Notification_broadcastId_idx" ON "Notification"("broadcastId");

CREATE TABLE IF NOT EXISTS "NotificationRecipient" (
  "id" TEXT PRIMARY KEY,
  "notificationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "NotificationRecipient" ADD COLUMN IF NOT EXISTS "notificationId" TEXT;
ALTER TABLE "NotificationRecipient" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "NotificationRecipient" ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3);
ALTER TABLE "NotificationRecipient" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
DO $$ BEGIN
  ALTER TABLE "NotificationRecipient"
    ADD CONSTRAINT "NotificationRecipient_notificationId_fkey"
    FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "NotificationRecipient"
    ADD CONSTRAINT "NotificationRecipient_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "NotificationRecipient_notificationId_userId_key"
  ON "NotificationRecipient"("notificationId", "userId");
CREATE INDEX IF NOT EXISTS "NotificationRecipient_userId_readAt_createdAt_idx"
  ON "NotificationRecipient"("userId", "readAt", "createdAt");
`;

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true" },
  connectionTimeoutMillis: 20000,
});

await client.connect();
try {
  await client.query(sql);
  console.log("OK notification tables applied");
} finally {
  await client.end();
}
