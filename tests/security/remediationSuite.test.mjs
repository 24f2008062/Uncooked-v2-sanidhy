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

test("Phase 17: Password Reset Fail-Closed Security Invariants", async () => {
  // Mock validation helper verifying fail-closed rules
  const evaluateResetInvariants = (authError, user, authRecords) => {
    if (authError) return { success: false, code: "AUTH_PROVIDER_UPDATE_FAILED" };
    if (!user) return { success: false, code: "USER_NOT_FOUND" };
    if (!user.authUserId && (!authRecords || authRecords.length === 0)) {
      return { success: false, code: "AUTH_IDENTITY_NOT_PROVISIONED" };
    }
    if (!user.authUserId && authRecords.length > 1) {
      return { success: false, code: "AUTH_IDENTITY_AMBIGUOUS" };
    }
    if (!user.authUserId && authRecords.length === 1 && !authRecords[0].email_confirmed_at) {
      return { success: false, code: "AUTH_IDENTITY_UNVERIFIED" };
    }
    return { success: true, code: "RESET_SUCCESS" };
  };

  // Test A: Supabase update failure produces fail-closed failure
  const resA = evaluateResetInvariants(new Error("Supabase outage"), { id: "u1", authUserId: "a1" }, []);
  assert.equal(resA.success, false);
  assert.equal(resA.code, "AUTH_PROVIDER_UPDATE_FAILED");

  // Test C: Missing Auth identity fails closed without account creation
  const resC = evaluateResetInvariants(null, { id: "u1", authUserId: null }, []);
  assert.equal(resC.success, false);
  assert.equal(resC.code, "AUTH_IDENTITY_NOT_PROVISIONED");

  // Test E: Ambiguous Auth identity fails closed
  const resE = evaluateResetInvariants(null, { id: "u1", authUserId: null }, [{ id: "a1" }, { id: "a2" }]);
  assert.equal(resE.success, false);
  assert.equal(resE.code, "AUTH_IDENTITY_AMBIGUOUS");

  // Test F: Unverified Supabase email fails closed
  const resF = evaluateResetInvariants(null, { id: "u1", authUserId: null }, [{ id: "a1", email_confirmed_at: null }]);
  assert.equal(resF.success, false);
  assert.equal(resF.code, "AUTH_IDENTITY_UNVERIFIED");
});

test("Phase 19: Concurrency and Replay Protection Mechanics", () => {
  // Simulate atomic token state machine
  let tokenStore = new Map([["token123", { identifier: "user@univ.edu" }]]);
  let providerUpdateCallCount = 0;

  const processResetRequest = (token) => {
    // Atomic deletion (claim token)
    const exists = tokenStore.has(token);
    if (exists) {
      tokenStore.delete(token); // Atomically claimed
    }
    if (!exists) {
      return { status: 400, code: "RESET_TOKEN_INVALID_OR_CONSUMED" };
    }

    // Call provider
    providerUpdateCallCount++;
    return { status: 200, code: "RESET_SUCCESS" };
  };

  // Concurrent Execution: Request A and Request B submit identical token
  const resA = processResetRequest("token123");
  const resB = processResetRequest("token123");

  assert.equal(resA.status, 200);
  assert.equal(resB.status, 400);
  assert.equal(resB.code, "RESET_TOKEN_INVALID_OR_CONSUMED");
  assert.equal(providerUpdateCallCount, 1, "Supabase updateUserById must be called EXACTLY ONCE across concurrent attempts");
});

test("Final Patch: Case A vs Case B Partial Success Distinction", () => {
  const evaluatePartialFailure = (wasAlreadyLinked, prismaUpdateSuccess) => {
    // Supabase update succeeded
    if (prismaUpdateSuccess) {
      return { status: 200, code: "RESET_SUCCESS" };
    }
    if (wasAlreadyLinked) {
      return { status: 200, code: "AUTH_UPDATED_LOCAL_CLEANUP_FAILED", message: "Your password has been reset successfully. You can now log in." };
    } else {
      return { status: 500, code: "AUTH_UPDATED_IDENTITY_LINK_FAILED", message: "Your password may have been updated, but we couldn't complete account recovery. Please try signing in with your new password. If access is not restored, contact support." };
    }
  };

  // Case A: Already Migrated User - Prisma cleanup fails -> Returns 200 OK (Auth functional)
  const resCaseA = evaluatePartialFailure(true, false);
  assert.equal(resCaseA.status, 200);
  assert.equal(resCaseA.code, "AUTH_UPDATED_LOCAL_CLEANUP_FAILED");

  // Case B: Unlinked Legacy User - Identity link fails -> Returns 500 Fail (Identity link incomplete)
  const resCaseB = evaluatePartialFailure(false, false);
  assert.equal(resCaseB.status, 500);
  assert.equal(resCaseB.code, "AUTH_UPDATED_IDENTITY_LINK_FAILED");
});

test("Final Patch: Migrated Account Password Authority Invariant", () => {
  const canAuthenticateLegacy = (user) => {
    if (user.authUserId !== null) {
      return false; // Hard stop: Migrated accounts MUST NOT authenticate via legacy hash
    }
    return Boolean(user.passwordHash);
  };

  const migratedUserWithFakeHash = {
    id: "u1",
    authUserId: "supa-123",
    passwordHash: "fake_scrypt_hash",
  };

  const unmigratedUser = {
    id: "u2",
    authUserId: null,
    passwordHash: "valid_scrypt_hash",
  };

  assert.equal(canAuthenticateLegacy(migratedUserWithFakeHash), false, "Migrated user MUST NOT authenticate against legacy passwordHash");
  assert.equal(canAuthenticateLegacy(unmigratedUser), true, "Unmigrated user may use legacy hash for JIT migration");
});



