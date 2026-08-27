import { createHash } from "crypto";
import { getClientIp } from "@/server/http/clientIp";

export { getClientIp };

export function hashIp(ip) {
  const secret = process.env.NEXTAUTH_SECRET || "uncooked-ip";
  return createHash("sha256").update(`${secret}:${ip || ""}`).digest("hex").slice(0, 32);
}
