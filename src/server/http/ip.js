import { createHash } from "crypto";
import { getClientIp } from "@/server/http/clientIp";

export { getClientIp };

export function hashIp(ip) {
  // Prefer auth secret so hashes are not reversible across environments.
  // Never use a hardcoded pepper — that makes IP hashes forgeable offline.
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("NEXTAUTH_SECRET is required to hash client IPs");
  }
  return createHash("sha256").update(`${secret}:${ip || ""}`).digest("hex").slice(0, 32);
}
