const buckets = new Map();

function prune(now) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

function memoryLimit(key, limit, windowMs) {
  const now = Date.now();
  prune(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: Math.ceil(windowMs / 1000), backend: "memory" };
  }
  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
      backend: "memory",
    };
  }
  bucket.count += 1;
  return {
    ok: true,
    remaining: limit - bucket.count,
    retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    backend: "memory",
  };
}

/**
 * Sync limiter for Edge middleware. Always memory-backed.
 */
export function rateLimit(key, limit, windowMs) {
  return memoryLimit(key, limit, windowMs);
}

/**
 * Async limiter for Node route handlers.
 * Uses Upstash Redis REST when configured; otherwise memory fallback.
 */
export async function rateLimitAsync(key, limit, windowMs) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const isProd = process.env.NODE_ENV === "production";

  if (!url || !token) {
    if (isProd) {
      console.warn(`[SECURITY_WARN] Upstash Redis not configured in production. Rate limit key "${key}" using instance-local memory fallback.`);
    }
    return memoryLimit(key, limit, windowMs);
  }

  const redisKey = `rl:${key}`;
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));

  try {
    const incrRes = await fetch(`${url}/incr/${encodeURIComponent(redisKey)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!incrRes.ok) {
      if (isProd) console.error(`[SECURITY_WARN] Upstash Redis INCR failed (${incrRes.status}) for key "${key}". Falling back to memory.`);
      return memoryLimit(key, limit, windowMs);
    }
    const incrJson = await incrRes.json();
    const count = Number(incrJson.result ?? incrJson);
    if (!Number.isFinite(count)) {
      if (isProd) console.error(`[SECURITY_WARN] Upstash Redis returned invalid count for key "${key}". Falling back to memory.`);
      return memoryLimit(key, limit, windowMs);
    }
    if (count === 1) {
      await fetch(`${url}/expire/${encodeURIComponent(redisKey)}/${windowSec}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
    }
    if (count > limit) {
      return { ok: false, remaining: 0, retryAfterSec: windowSec, backend: "redis" };
    }
    return {
      ok: true,
      remaining: Math.max(0, limit - count),
      retryAfterSec: windowSec,
      backend: "redis",
    };
  } catch (err) {
    if (isProd) console.error(`[SECURITY_WARN] Upstash Redis fetch error for key "${key}":`, err.message);
    return memoryLimit(key, limit, windowMs);
  }
}

export function rateLimitHeaders(result) {
  return {
    "Retry-After": String(result.retryAfterSec),
    "X-RateLimit-Remaining": String(result.remaining),
  };
}
