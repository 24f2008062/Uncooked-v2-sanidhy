import assert from "node:assert/strict";
import test from "node:test";

const buckets = new Map();

function rateLimit(key, limit, windowMs, now = Date.now()) {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (bucket.count >= limit) return { ok: false, remaining: 0 };
  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count };
}

test("allows requests under the limit", () => {
  buckets.clear();
  assert.equal(rateLimit("a", 3, 1000, 1).ok, true);
  assert.equal(rateLimit("a", 3, 1000, 1).ok, true);
  assert.equal(rateLimit("a", 3, 1000, 1).ok, true);
});

test("blocks the request over the limit", () => {
  buckets.clear();
  rateLimit("b", 1, 1000, 1);
  assert.equal(rateLimit("b", 1, 1000, 1).ok, false);
});
