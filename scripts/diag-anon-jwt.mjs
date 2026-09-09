import { readFileSync } from "node:fs";

const t = readFileSync(".env.local", "utf8");
let anon =
  t
    .split(/\r?\n/)
    .find((l) => l.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY="))
    ?.slice("NEXT_PUBLIC_SUPABASE_ANON_KEY=".length)
    .trim() || "";
if (
  (anon.startsWith('"') && anon.endsWith('"')) ||
  (anon.startsWith("'") && anon.endsWith("'"))
) {
  anon = anon.slice(1, -1);
}

const parts = anon.split(".");
console.log({
  parts: parts.length,
  partLens: parts.map((p) => p.length),
  total: anon.length,
});

if (parts.length >= 2) {
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    console.log("payload_keys", Object.keys(payload));
    console.log("payload_meta", {
      role: payload.role,
      iss: payload.iss,
      ref: payload.ref,
      exp: payload.exp,
      iat: payload.iat,
    });
  } catch (e) {
    console.log("payload_decode_fail", e.message);
  }
}

// Compare: does production login behave like supabase unreachable?
// If we get rapid 401 without Set-Cookie, auth path is reachable enough to return.
// Check migrate-login similarly.
const BASE = "https://uncooked-v2.vercel.app";
const r = await fetch(`${BASE}/api/auth/migrate-login`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: BASE },
  body: JSON.stringify({ email: "x@y.com", password: "ValidPass1234!x" }),
});
console.log("migrate", r.status, await r.text());
