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

for (const key of ["DATABASE_URL", "DIRECT_URL", "NEXT_PUBLIC_SUPABASE_URL"]) {
  const v = get(key);
  if (!v) {
    console.log(key, "MISSING");
    continue;
  }
  try {
    // mask credentials
    const u = new URL(v.replace(/^postgresql:/, "http:").replace(/^postgres:/, "http:"));
    console.log(key, {
      protocol: v.split(":")[0],
      host: u.host,
      hostname: u.hostname,
      port: u.port,
      pathname: u.pathname,
      hasUser: Boolean(u.username),
    });
  } catch (e) {
    console.log(key, "parse_fail", e.message, "len", v.length);
  }
}
