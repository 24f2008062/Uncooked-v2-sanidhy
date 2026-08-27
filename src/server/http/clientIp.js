export function getClientIp(req) {
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
