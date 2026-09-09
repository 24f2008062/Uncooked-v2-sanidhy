import { readFileSync } from "node:fs";

function get(name) {
  const line = readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .find((l) => l.startsWith(name + "="));
  if (!line) return null;
  let v = line.slice(name.length + 1).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  return v;
}

const db = get("DATABASE_URL");
const u = new URL(db.replace(/^postgresql:/, "http:").replace(/^postgres:/, "http:"));
const user = decodeURIComponent(u.username);
// Typical: postgres.<project-ref> or postgres
const refGuess = user.includes(".") ? user.split(".").pop() : null;
console.log({
  dbUserPrefix: user.split(".")[0],
  projectRefFromDbUser: refGuess,
  authUrlHost: "uncooked-dev-project.supabase.co",
  mismatch: refGuess && refGuess !== "uncooked-dev-project",
});

if (refGuess) {
  const authHost = `${refGuess}.supabase.co`;
  const r = await fetch(
    `https://cloudflare-dns.com/dns-query?name=${authHost}&type=A`,
    { headers: { accept: "application/dns-json" } }
  );
  const j = await r.json();
  console.log("dns_for_db_ref", authHost, {
    status: j.Status,
    answers: (j.Answer || []).map((a) => a.data),
  });
}
