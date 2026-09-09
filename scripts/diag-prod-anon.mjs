const BASE = "https://uncooked-v2.vercel.app";
const html = await (await fetch(BASE + "/signup")).text();
const scripts = [...new Set([...html.matchAll(/\/_next\/static\/[^"']+/g)].map((m) => m[0]))];
console.log("scripts", scripts.length);
for (const s of scripts) {
  const t = await (await fetch(BASE + s)).text();
  if (!/supabase|eyJhbGci|anon/i.test(t)) continue;
  console.log("candidate", s, "len", t.length);
  // Find JWT-like strings
  const jwts = [...t.matchAll(/eyJhbGciOi[^"`'\s]{20,}/g)].map((m) => m[0]);
  for (const j of jwts.slice(0, 5)) {
    const parts = j.split(".");
    console.log("jwt parts", parts.length, "lens", parts.map((p) => p.length), "total", j.length);
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
        console.log("payload", { role: payload.role, ref: payload.ref, iss: payload.iss });
      } catch (e) {
        console.log("decode fail", e.message);
      }
    }
  }
  // sb_publishable keys
  const sb = [...t.matchAll(/sb_publishable_[a-zA-Z0-9_]+/g)].map((m) => m[0]);
  if (sb.length) console.log("sb_keys_sample_lens", sb.map((x) => x.length));
  // url context
  const idx = t.indexOf("uncooked-dev-project");
  if (idx >= 0) console.log("url ctx", JSON.stringify(t.slice(idx - 30, idx + 60)));
}
