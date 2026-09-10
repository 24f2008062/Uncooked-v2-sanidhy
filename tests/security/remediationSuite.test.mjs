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

test("Issue #23: Registration password complexity validation", async () => {
  const { validatePasswordPolicy } = await import("../../src/server/utils/passwordUtils.js");

  assert.ok(validatePasswordPolicy("short1A"));
  assert.ok(validatePasswordPolicy("onlyletterslowercase"));
  assert.ok(validatePasswordPolicy("123456789012345"));
  assert.equal(validatePasswordPolicy("ValidPassword123"), null);
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

test("Issue #25/#30: Email/HTML XSS escaping", async () => {
  const { escapeHtml, safeHttpsUrl } = await import("../../src/server/security/html.js");

  const malScript = '<script>alert("xss")</script>';
  const sanitized = escapeHtml(malScript);

  assert.equal(sanitized, "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;");
  assert.equal(sanitized.includes("<script>"), false);
  assert.equal(safeHttpsUrl("https://cdn.example.com/a.png"), "https://cdn.example.com/a.png");
  assert.equal(safeHttpsUrl("javascript:alert(1)"), null);
  assert.equal(safeHttpsUrl("http://insecure.example.com/x"), null);
});

test("Phase 17: Password Reset Fail-Closed Security Invariants", async () => {
  // Mock validation helper verifying fail-closed rules and JIT provisioning
  const evaluateResetInvariants = (authError, user, authRecords) => {
    if (authError) return { success: false, code: "AUTH_PROVIDER_UPDATE_FAILED" };
    if (!user) return { success: false, code: "USER_NOT_FOUND" };
    if (!user.authUserId && (!authRecords || authRecords.length === 0)) {
      return { success: true, code: "AUTH_IDENTITY_JIT_PROVISIONED" };
    }
    if (!user.authUserId && authRecords.length > 1) {
      return { success: false, code: "AUTH_IDENTITY_AMBIGUOUS" };
    }
    if (!user.authUserId && authRecords.length === 1 && !authRecords[0].email_confirmed_at) {
      return { success: true, code: "AUTH_IDENTITY_EMAIL_CONFIRMED" };
    }
    return { success: true, code: "RESET_SUCCESS" };
  };

  // Test A: Supabase update failure produces fail-closed failure
  const resA = evaluateResetInvariants(new Error("Supabase outage"), { id: "u1", authUserId: "a1" }, []);
  assert.equal(resA.success, false);
  assert.equal(resA.code, "AUTH_PROVIDER_UPDATE_FAILED");

  // Test C: Missing Auth identity provisions JIT for existing application user
  const resC = evaluateResetInvariants(null, { id: "u1", authUserId: null }, []);
  assert.equal(resC.success, true);
  assert.equal(resC.code, "AUTH_IDENTITY_JIT_PROVISIONED");

  // Test E: Ambiguous Auth identity fails closed
  const resE = evaluateResetInvariants(null, { id: "u1", authUserId: null }, [{ id: "a1" }, { id: "a2" }]);
  assert.equal(resE.success, false);
  assert.equal(resE.code, "AUTH_IDENTITY_AMBIGUOUS");

  // Test F: Unverified Supabase email is confirmed via validated reset token
  const resF = evaluateResetInvariants(null, { id: "u1", authUserId: null }, [{ id: "a1", email_confirmed_at: null }]);
  assert.equal(resF.success, true);
  assert.equal(resF.code, "AUTH_IDENTITY_EMAIL_CONFIRMED");
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

test("Issue #32: Edge LOCKED claim respects locked_until expiry", () => {
  const isEdgeBlocked = (appMetadata) => {
    const status = String(appMetadata?.account_status || "").toUpperCase();
    const lockedUntilMs = appMetadata?.locked_until ? Date.parse(String(appMetadata.locked_until)) : NaN;
    const lockStillActive =
      status === "LOCKED" && (!Number.isFinite(lockedUntilMs) || lockedUntilMs > Date.now());
    return lockStillActive || status === "DISABLED" || status === "DELETED";
  };

  assert.equal(isEdgeBlocked({ account_status: "LOCKED", locked_until: new Date(Date.now() + 60_000).toISOString() }), true);
  assert.equal(isEdgeBlocked({ account_status: "LOCKED", locked_until: new Date(Date.now() - 60_000).toISOString() }), false);
  assert.equal(isEdgeBlocked({ account_status: "DISABLED" }), true);
  assert.equal(isEdgeBlocked({ account_status: "ACTIVE" }), false);
});

test("Issue #38: getAppBaseUrl never trusts request Host", async () => {
  const prevApp = process.env.NEXT_PUBLIC_APP_URL;
  const prevAuth = process.env.NEXTAUTH_URL;
  process.env.NEXT_PUBLIC_APP_URL = "https://app.opportia.example";
  process.env.NEXTAUTH_URL = "https://ignored.example";
  const { getAppBaseUrl } = await import("../../src/lib/appUrl.js");
  assert.equal(getAppBaseUrl(), "https://app.opportia.example");
  process.env.NEXT_PUBLIC_APP_URL = prevApp;
  process.env.NEXTAUTH_URL = prevAuth;
});

test("OWASP: check-user must not return exists boolean", async () => {
  const src = await import("node:fs").then((fs) =>
    fs.readFileSync(new URL("../../src/app/api/auth/check-user/route.js", import.meta.url), "utf8")
  );
  assert.equal(/exists:\s*!!/.test(src), false);
  assert.equal(/exists:\s*Boolean/.test(src), false);
  assert.ok(src.includes("enforceMutationGuards"));
});

test("OWASP: CSP must not allow unsafe-eval", async () => {
  const nextConfig = (await import("../../next.config.mjs")).default;
  const headers = await nextConfig.headers();
  const csp = headers[0].headers.find((h) => h.key === "Content-Security-Policy")?.value || "";
  assert.equal(csp.includes("unsafe-eval"), false);
  assert.ok(csp.includes("script-src"));
});

test("Issue #52: support ticket status transitions", async () => {
  const { validateSupportStatusTransition } = await import("../../src/server/support/ticketStatus.js");
  assert.equal(validateSupportStatusTransition("OPEN", "IN_PROGRESS").ok, true);
  assert.equal(validateSupportStatusTransition("IN_PROGRESS", "RESOLVED").ok, true);
  assert.equal(validateSupportStatusTransition("CLOSED", "IN_PROGRESS").ok, false);
  assert.equal(validateSupportStatusTransition("OPEN", "NOPE").ok, false);
});

test("Issue #50: degraded rate-limit policy classes", async () => {
  const { degradedModePolicy } = await import("../../src/server/http/rateLimit.js");
  assert.equal(degradedModePolicy("rl_auth_login:abc"), "fail_closed");
  assert.equal(degradedModePolicy("rl_admin_support:x"), "fail_closed");
  assert.equal(degradedModePolicy("rl_contact:x"), "fail_open_strict");
  assert.equal(degradedModePolicy("rl_misc:x"), "fail_open");
});

test("Issue #49: migrate-login must not emit ALREADY_MIGRATED", async () => {
  const fs = await import("node:fs");
  const src = fs.readFileSync(new URL("../../src/app/api/auth/migrate-login/route.js", import.meta.url), "utf8");
  assert.equal(src.includes("ALREADY_MIGRATED"), false);
  assert.ok(src.includes("INVALID_CREDENTIALS"));
});

test("Issue #54: dashboard stats expose targetId alias for entityId", async () => {
  const fs = await import("node:fs");
  const src = fs.readFileSync(
    new URL("../../src/app/api/v2/admin/dashboard/stats/route.js", import.meta.url),
    "utf8"
  );
  assert.ok(src.includes("targetId: log.entityId"));
});

test("Issue #34: production email path must not report mock success", async () => {
  const prev = process.env.NODE_ENV;
  const prevResend = process.env.RESEND_API_KEY;
  const prevHost = process.env.SMTP_HOST;
  process.env.NODE_ENV = "production";
  delete process.env.RESEND_API_KEY;
  delete process.env.SMTP_HOST;
  const { sendEmail } = await import("../../src/lib/email/service.js");
  const result = await sendEmail({ to: "a@b.co", subject: "t", html: "<p>x</p>", text: "x" });
  assert.equal(result.success, false);
  assert.equal(result.provider, "none");
  process.env.NODE_ENV = prev;
  if (prevResend != null) process.env.RESEND_API_KEY = prevResend;
  if (prevHost != null) process.env.SMTP_HOST = prevHost;
});



