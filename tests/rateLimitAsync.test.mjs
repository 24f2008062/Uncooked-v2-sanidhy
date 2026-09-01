import assert from "node:assert/strict";
import test from "node:test";
import { rateLimitAsync } from "../src/server/http/rateLimit.js";

test("rateLimitAsync falls back to memory without Upstash env", async () => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  const key = `async-${Date.now()}-${Math.random()}`;
  const a = await rateLimitAsync(key, 2, 60_000);
  const b = await rateLimitAsync(key, 2, 60_000);
  const c = await rateLimitAsync(key, 2, 60_000);
  assert.equal(a.ok, true);
  assert.equal(b.ok, true);
  assert.equal(c.ok, false);
  assert.equal(a.backend, "memory");
});
