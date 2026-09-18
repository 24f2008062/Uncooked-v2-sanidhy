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
 * Sync limiter for Edge Proxy. Always memory-backed.
 */
export function rateLimit(key, limit, windowMs) {
  return memoryLimit(key, limit, windowMs);
}

/**
 * Route-class policy when shared Redis is down / unavailable (#50).
 * - fail_closed: deny request (used for auth / password / admin mutations)
 * - fail_open_strict: allow but with much tighter in-memory caps
 * - fail_open: allow with normal memory fallback (low-risk routes)
 */
export function degradedModePolicy(rateKey = "") {
  const k = String(rateKey);
  if (
    k.includes("auth_login") ||
    k.includes("auth_migrate") ||
    k.includes("reset_password") ||
    k.includes("forgot_password") ||
    k.includes("auth_register") ||
    k.includes("rl_admin")
  ) {
    return "fail_closed";
  }
  if (k.includes("rl_contact") || k.includes("rl_host") || k.includes("rl_register")) {
    return "fail_open_strict";
  }
  return "fail_open";
}

function applyDegradedFallback(key, limit, windowMs, rateKeyHint) {
  const policy = degradedModePolicy(rateKeyHint || key);
  if (policy === "fail_closed") {
    console.error(`[SECURITY_ALERT] rate_limit_degraded fail_closed key=${key}`);
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil(windowMs / 1000)),
      backend: "degraded_fail_closed",
      degraded: true,
      policy,
    };
  }
  const strictLimit = policy === "fail_open_strict" ? Math.max(1, Math.min(limit, 3)) : limit;
  console.warn(`[SECURITY_ALERT] rate_limit_degraded ${policy} key=${key} limit=${strictLimit}`);
  const result = memoryLimit(key, strictLimit, windowMs);
  return { ...result, degraded: true, policy };
}

/**
 * Async limiter for Node route handlers.
 * Uses Upstash Redis REST when configured; otherwise policy-driven fallback (#50/#53).
 */
export async function rateLimitAsync(key, limit, windowMs) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const isProd = process.env.NODE_ENV === "production";

  if (!url || !token) {
    if (isProd) {
      console.warn(
        `[SECURITY_WARN] Upstash Redis not configured in production. Rate limit key "${key}" using degraded policy.`
      );
      return applyDegradedFallback(key, limit, windowMs, key);
    }
    return memoryLimit(key, limit, windowMs);
  }

  const redisKey = `rl:${key}`;
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));

  try {
    // Single round-trip: INCR + EXPIRE NX (set TTL only when key has no expiry) (#53)
    const pipeRes = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, String(windowSec), "NX"],
      ]),
      cache: "no-store",
    });
    if (!pipeRes.ok) {
      if (isProd) {
        console.error(`[SECURITY_WARN] Upstash Redis pipeline failed (${pipeRes.status}) for key "${key}".`);
      }
      return applyDegradedFallback(key, limit, windowMs, key);
    }
    const pipeJson = await pipeRes.json();
    const count = Number(pipeJson?.[0]?.result ?? pipeJson?.[0]);
    if (!Number.isFinite(count)) {
      if (isProd) {
        console.error(`[SECURITY_WARN] Upstash Redis returned invalid count for key "${key}".`);
      }
      return applyDegradedFallback(key, limit, windowMs, key);
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
    return applyDegradedFallback(key, limit, windowMs, key);
  }
}

export function rateLimitHeaders(result) {
  return {
    "Retry-After": String(result.retryAfterSec),
    "X-RateLimit-Remaining": String(result.remaining),
    ...(result.degraded ? { "X-RateLimit-Degraded": result.policy || "1" } : {}),
  };
}
