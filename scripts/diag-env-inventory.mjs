import { readFileSync, existsSync } from "node:fs";

const files = [
  ".env",
  ".env.local",
  ".env.production",
  ".env.production.local",
  ".env.vercel",
];

for (const f of files) {
  if (!existsSync(f)) {
    console.log(f, "missing");
    continue;
  }
  const t = readFileSync(f, "utf8");
  const lines = t
    .split(/\r?\n/)
    .filter((l) => /SUPABASE|APP_URL|DATABASE|SERVICE_ROLE|ANON|RESEND|SMTP|UPSTASH|NEXTAUTH/i.test(l) && !l.startsWith("#"));
  for (const l of lines) {
    const i = l.indexOf("=");
    if (i < 0) continue;
    const k = l.slice(0, i);
    let v = l.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    const host = v.startsWith("http") || v.startsWith("postgres")
      ? (() => {
          try {
            return new URL(v.replace(/^postgres(ql)?:/, "http:")).hostname;
          } catch {
            return "parse_err";
          }
        })()
      : "";
    console.log(
      JSON.stringify({
        file: f,
        key: k,
        len: v.length,
        jwtParts: /KEY|SECRET|TOKEN/i.test(k) ? v.split(".").length : null,
        host: host || undefined,
        present: v.length > 0,
      })
    );
  }
}
