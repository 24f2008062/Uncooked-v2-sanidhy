export function getClientIp(req) {
  // Prefer platform-provided client IP. On Vercel, x-forwarded-for is set by
  // the edge and the leftmost entry is the client. Do not invent IPs from
  // untrusted custom headers beyond these standard proxy headers.
  const vercel = req.headers.get("x-vercel-forwarded-for");
  if (vercel) {
    return vercel.split(",")[0].trim().slice(0, 64);
  }
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim().slice(0, 64);
  }
  return req.headers.get("x-real-ip") || "0.0.0.0";
}

/** Sync fingerprint for Edge rate-limit keys. Not a password hash. */
export function fingerprintIp(ip, secret = "") {
  const s = `${secret}:${ip || ""}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
