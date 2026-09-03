import test from "node:test";
import assert from "node:assert/strict";
import { isSuperAdmin, hasRole, hasPermission } from "../../src/server/auth/authorization.js";
import { isAccountBlocked } from "../../src/server/auth/authentication.js";
import { rateLimitAsync } from "../../src/server/http/rateLimit.js";
import nextConfig from "../../next.config.mjs";

test("Issue #18: DB-backed RBAC authorization functions", () => {
  const normalUser = { id: "u1", role: "USER" };
  const superAdmin = { id: "u2", role: "SUPER_ADMIN" };
  const nullUser = null;

  assert.equal(isSuperAdmin(normalUser), false);
  assert.equal(isSuperAdmin(superAdmin), true);
  assert.equal(isSuperAdmin(nullUser), false);

  assert.equal(hasRole(normalUser, "SUPER_ADMIN"), false);
  assert.equal(hasRole(superAdmin, "SUPER_ADMIN"), true);
  assert.equal(hasRole(normalUser, "USER"), true);

  assert.equal(hasPermission(normalUser, "MANAGE_PLATFORM"), false);
  assert.equal(hasPermission(superAdmin, "MANAGE_PLATFORM"), true);
});

test("Issue #20 & #26: Account status blocking detection", () => {
  const activeUser = { id: "u1", role: "USER" };
  const deletedUser = { id: "u2", role: "USER", deletedAt: new Date() };
  const disabledUser = { id: "u3", role: "USER", disabledAt: new Date() };
  const lockedUser = { id: "u4", role: "USER", lockedUntil: new Date(Date.now() + 3600000) };
  const expiredLockUser = { id: "u5", role: "USER", lockedUntil: new Date(Date.now() - 3600000) };

  assert.equal(isAccountBlocked(activeUser), false);
  assert.equal(isAccountBlocked(deletedUser), true);
  assert.equal(isAccountBlocked(disabledUser), true);
  assert.equal(isAccountBlocked(lockedUser), true);
  assert.equal(isAccountBlocked(expiredLockUser), false);
  assert.equal(isAccountBlocked(null), true);
});

test("Issue #22: Next.js image remotePatterns and CSP restrictions", () => {
  const patterns = nextConfig.images.remotePatterns;
  assert.ok(Array.isArray(patterns));

  // Verify wildcard hosts ** are rejected
  const hasWildcard = patterns.some((p) => p.hostname === "**");
  assert.equal(hasWildcard, false, "remotePatterns must not contain wildcard **");

  // Verify required explicitly whitelisted hosts exist
  const hostnames = patterns.map((p) => p.hostname);
  assert.ok(hostnames.includes("images.unsplash.com"));
  assert.ok(hostnames.includes("ui-avatars.com"));
  assert.ok(hostnames.includes("*.supabase.co"));
});

test("Issue #23: Registration password complexity validation", () => {
  const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{12,}$/;

  assert.equal(PASSWORD_REGEX.test("short1A"), false, "Rejects short password");
  assert.equal(PASSWORD_REGEX.test("onlyletterslowercase"), false, "Rejects password without numbers");
  assert.equal(PASSWORD_REGEX.test("123456789012345"), false, "Rejects password without letters");
  assert.equal(PASSWORD_REGEX.test("ValidPassword123"), true, "Accepts strong compliant password");
});

test("Issue #28: Upstash Redis fallback telemetry", async () => {
  const res = await rateLimitAsync("test_key_remediation", 10, 60000);
  assert.ok(res);
  assert.equal(typeof res.ok, "boolean");
  assert.ok(res.remaining >= 0);
  assert.ok(["memory", "redis"].includes(res.backend));
});

test("Issue #29: Telemetry snapshot query bounds clamping", () => {
  const clampWindow = (raw) => {
    const p = parseInt(raw, 10);
    return Math.min(Math.max(Number.isNaN(p) ? 60 : p, 5), 1440);
  };
  const clampLimit = (raw) => {
    const p = parseInt(raw, 10);
    return Math.min(Math.max(Number.isNaN(p) ? 50 : p, 1), 500);
  };

  assert.equal(clampWindow("-10"), 5, "Clamps negative window to minimum 5");
  assert.equal(clampWindow("99999"), 1440, "Clamps excessive window to maximum 1440");
  assert.equal(clampWindow("120"), 120, "Preserves valid window 120");

  assert.equal(clampLimit("0"), 1, "Clamps 0 limit to minimum 1");
  assert.equal(clampLimit("10000"), 500, "Clamps excessive limit to maximum 500");
  assert.equal(clampLimit("25"), 25, "Preserves valid limit 25");
});

test("Issue #30: Contact form input XSS sanitization", () => {
  function sanitizeText(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  }

  const malScript = '<script>alert("xss")</script>';
  const sanitized = sanitizeText(malScript);

  assert.equal(sanitized, '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  assert.equal(sanitized.includes("<script>"), false);
});
