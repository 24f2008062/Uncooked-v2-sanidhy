import { jsonOk, jsonError } from "@/server/http/envelope";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  let database = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "down";
  }

  const redisConfigured = Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
  const payload = {
    status: database === "ok" ? "ok" : "degraded",
    database,
    rateLimitBackend: redisConfigured ? "redis" : "memory",
    verifiedHostsOnly: String(process.env.VERIFIED_HOSTS_ONLY || "").toLowerCase() === "true",
    latencyMs: Date.now() - started,
    time: new Date().toISOString(),
  };

  if (database !== "ok") {
    return jsonError("Service temporarily unavailable", 503, "DEPENDENCY_UNAVAILABLE");
  }
  return jsonOk(payload);
}
