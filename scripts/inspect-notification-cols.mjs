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
const cols = await client.query(
  `SELECT column_name, is_nullable, data_type, column_default
   FROM information_schema.columns
   WHERE table_schema='public' AND table_name='Notification'
   ORDER BY ordinal_position`
);
console.log("Notification", cols.rows);
const cols2 = await client.query(
  `SELECT column_name, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_schema='public' AND table_name='NotificationRecipient'
   ORDER BY ordinal_position`
);
console.log("NotificationRecipient", cols2.rows);
await client.end();
