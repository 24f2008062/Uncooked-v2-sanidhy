import assert from "node:assert/strict";
import test from "node:test";
import { safeInternalPath } from "../../src/lib/safeRedirect.js";
import { requireAuthSecret, requireTicketHmacSecret } from "../../src/server/security/secrets.js";

test("safeInternalPath blocks open redirects", () => {
  assert.equal(safeInternalPath("/dashboard"), "/dashboard");
  assert.equal(safeInternalPath("/events/abc"), "/events/abc");
  assert.equal(safeInternalPath("//evil.com"), "/dashboard");
  assert.equal(safeInternalPath("https://evil.com"), "/dashboard");
  assert.equal(safeInternalPath("/\\evil.com"), "/dashboard");
  assert.equal(safeInternalPath("\\\\evil.com"), "/dashboard");
  assert.equal(safeInternalPath("/http://evil.com"), "/dashboard");
  assert.equal(safeInternalPath("dashboard"), "/dashboard");
  assert.equal(safeInternalPath(null, "/profile"), "/profile");
});

test("requireAuthSecret rejects missing and placeholder secrets", () => {
  assert.throws(() => requireAuthSecret({}), /not configured/);
  assert.throws(() => requireAuthSecret({ NEXTAUTH_SECRET: "short" }), /at least 32/);
  assert.throws(
    () => requireAuthSecret({ NEXTAUTH_SECRET: "dev_secret_please_change_me_now_123456" }),
    /placeholder/
  );
  assert.throws(
    () => requireAuthSecret({ NEXTAUTH_SECRET: "uncooked_production_fallback_secret_32_chars_min" }),
    /placeholder/
  );
  const ok = "x".repeat(48);
  assert.equal(requireAuthSecret({ NEXTAUTH_SECRET: ok }), ok);
});

test("requireTicketHmacSecret must differ from session secret", () => {
  const a = "a".repeat(48);
  const b = "b".repeat(48);
  assert.throws(() => requireTicketHmacSecret({ TICKET_HMAC_SECRET: a, NEXTAUTH_SECRET: a }), /different/);
  assert.equal(requireTicketHmacSecret({ TICKET_HMAC_SECRET: b, NEXTAUTH_SECRET: a }), b);
});
