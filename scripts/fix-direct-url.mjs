import { readFileSync, writeFileSync } from "node:fs";

const p = ".env.local";
let t = readFileSync(p, "utf8");
t = t.replace(/postgres&connection_limit=/g, "postgres?connection_limit=");
writeFileSync(p, t);

const line = t.split(/\r?\n/).find((l) => l.startsWith("DIRECT_URL="));
let v = line ? line.slice("DIRECT_URL=".length).trim() : "";
if (
  (v.startsWith('"') && v.endsWith('"')) ||
  (v.startsWith("'") && v.endsWith("'"))
) {
  v = v.slice(1, -1);
}
const u = new URL(v.replace(/^postgresql:/, "http:").replace(/^postgres:/, "http:"));
console.log("DIRECT path", u.pathname, "search", u.search);
