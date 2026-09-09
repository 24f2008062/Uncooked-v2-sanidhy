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
await client.query(`
  ALTER TABLE "BulletinUpdate" ADD COLUMN IF NOT EXISTS "authorId" TEXT;
  ALTER TABLE "BulletinUpdate" ADD COLUMN IF NOT EXISTS "mediaUrl" TEXT;
  CREATE INDEX IF NOT EXISTS "BulletinUpdate_eventId_createdAt_idx"
    ON "BulletinUpdate"("eventId", "createdAt");
`);
console.log("OK BulletinUpdate columns ready");
await client.end();
