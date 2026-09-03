const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const target = path.join(process.cwd(), ".env.local");
if (fs.existsSync(target)) {
  console.log(".env.local already exists; not overwriting");
  process.exit(0);
}

const secret = crypto.randomBytes(32).toString("hex");
const ticket = crypto.randomBytes(32).toString("hex");
const body = [
  "NEXTAUTH_URL=http://localhost:3000",
  "NEXT_PUBLIC_APP_URL=http://localhost:3000",
  `NEXTAUTH_SECRET=${secret}`,
  `TICKET_HMAC_SECRET=${ticket}`,
  "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/uncooked_db?schema=public",
  "DIRECT_URL=postgresql://postgres:postgres@localhost:5432/uncooked_db?schema=public",
  "DATABASE_SSL_REJECT_UNAUTHORIZED=true",
  "LEGAL_ENTITY_NAME=Uncooked",
  "GRIEVANCE_OFFICER_NAME=Grievance Officer",
  "GRIEVANCE_EMAIL=support@uncooked.in",
  "SUPPORT_EMAIL=support@uncooked.in",
  "NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false",
  "",
].join("\n");

fs.writeFileSync(target, body);
console.log("wrote .env.local");
