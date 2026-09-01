const buckets = new Map();

function prune(now) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

/**
 * Fixed-window limiter. Single-instance only (serverless will be per-isolate).
 * Fail closed on abuse; fail open only if Map ops throw.
 * For hard cross-instance guarantees, back this with Redis/Upstash.
 */
export function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  prune(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: Math.ceil(windowMs / 1000) };
  }
  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
}

export function rateLimitHeaders(result) {
  return {
    "Retry-After": String(result.retryAfterSec),
    "X-RateLimit-Remaining": String(result.remaining),
  };
}
