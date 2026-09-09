import { readFileSync } from "node:fs";
import { lookup } from "node:dns/promises";

const t = readFileSync(".env.local", "utf8");
const anonLine = t.split(/\r?\n/).find((l) => l.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY="));
const urlLine = t.split(/\r?\n/).find((l) => l.startsWith("NEXT_PUBLIC_SUPABASE_URL="));
let anon = anonLine?.slice("NEXT_PUBLIC_SUPABASE_ANON_KEY=".length).trim() || "";
let url = urlLine?.slice("NEXT_PUBLIC_SUPABASE_URL=".length).trim() || "";
if ((anon.startsWith('"') && anon.endsWith('"')) || (anon.startsWith("'") && anon.endsWith("'"))) anon = anon.slice(1, -1);
if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) url = url.slice(1, -1);

console.log({
  url,
  anonLen: anon.length,
  startsEyJ: anon.startsWith("eyJ"),
  looksPlaceholder: /placeholder|changeme|your-|xxx|anon-key/i.test(anon),
});

try {
  const host = new URL(url).hostname;
  const addrs = await lookup(host, { all: true });
  console.log("dns", host, addrs);
} catch (e) {
  console.log("dns_fail", e.code || e.message);
}

const BASE = "https://uncooked-v2.vercel.app";
try {
  const login = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ email: "dns-check@example.com", password: "ValidPass1234!x" }),
  });
  console.log("prod_login", login.status, await login.text());
} catch (e) {
  console.log("prod_login_fail", e.message);
}
