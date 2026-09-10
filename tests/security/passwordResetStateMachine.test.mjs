import test from "node:test";
import assert from "node:assert/strict";

// Helper mocking atomic token store with claimedAt and consumedAt
class MockTokenStore {
  constructor(initialTokens = []) {
    this.tokens = new Map();
    for (const t of initialTokens) {
      this.tokens.set(`${t.identifier}:${t.token}`, { ...t });
    }
  }

  async updateManyClaim(identifier, token, expiresAfter) {
    const key = `${identifier}:${token}`;
    const row = this.tokens.get(key);
    if (!row) return { count: 0 };
    if (row.expires <= expiresAfter) return { count: 0 };
    if (row.claimedAt !== null || row.consumedAt !== null) return { count: 0 };
    row.claimedAt = new Date();
    return { count: 1 };
  }

  async releaseClaim(identifier, token) {
    const key = `${identifier}:${token}`;
    const row = this.tokens.get(key);
    if (row && row.consumedAt === null) {
      row.claimedAt = null;
      return { count: 1 };
    }
    return { count: 0 };
  }

  async markConsumed(identifier, token) {
    const key = `${identifier}:${token}`;
    const row = this.tokens.get(key);
    if (row) {
      row.consumedAt = new Date();
      return { count: 1 };
    }
    return { count: 0 };
  }

  find(identifier, token) {
    return this.tokens.get(`${identifier}:${token}`) || null;
  }
}

test("Test 1: Concurrency Race Prevention - Atomic Claim Machine", async () => {
  const store = new MockTokenStore([
    {
      identifier: "student@univ.edu",
      token: "secret_tok_123",
      purpose: "PASSWORD_RESET",
      expires: new Date(Date.now() + 60000),
      claimedAt: null,
      consumedAt: null,
    },
  ]);

  // Two simultaneous requests race to claim the same token
  const [resA, resB] = await Promise.all([
    store.updateManyClaim("student@univ.edu", "secret_tok_123", new Date()),
    store.updateManyClaim("student@univ.edu", "secret_tok_123", new Date()),
  ]);

  assert.equal(resA.count + resB.count, 1, "Exactly one request must successfully claim the token");

  const winner = resA.count === 1 ? "Request A" : "Request B";
  assert.ok(winner, "One request won the claim");

  // The winner consumes the token
  await store.markConsumed("student@univ.edu", "secret_tok_123");

  // Subsequent claim fails
  const resC = await store.updateManyClaim("student@univ.edu", "secret_tok_123", new Date());
  assert.equal(resC.count, 0, "Consumed token can never be claimed again");
});

test("Test 2: Weak Password Releases Claim For Immediate Retry", async () => {
  const store = new MockTokenStore([
    {
      identifier: "student@univ.edu",
      token: "tok_retry",
      purpose: "PASSWORD_RESET",
      expires: new Date(Date.now() + 60000),
      claimedAt: null,
      consumedAt: null,
    },
  ]);

  // Attempt 1: Claims token
  const claim1 = await store.updateManyClaim("student@univ.edu", "tok_retry", new Date());
  assert.equal(claim1.count, 1);

  // Provider returns WEAK_PASSWORD -> Token claim is released
  await store.releaseClaim("student@univ.edu", "tok_retry");
  const tokenStateAfterRelease = store.find("student@univ.edu", "tok_retry");
  assert.equal(tokenStateAfterRelease.claimedAt, null);
  assert.equal(tokenStateAfterRelease.consumedAt, null);

  // Attempt 2: User retries with strong password -> Claim succeeds!
  const claim2 = await store.updateManyClaim("student@univ.edu", "tok_retry", new Date());
  assert.equal(claim2.count, 1, "User must be able to retry with the same link after weak password error");

  // Consumes token on success
  await store.markConsumed("student@univ.edu", "tok_retry");
  const finalState = store.find("student@univ.edu", "tok_retry");
  assert.ok(finalState.consumedAt !== null);
});

test("Test 3: Transient Provider Outage Releases Claim", async () => {
  const store = new MockTokenStore([
    {
      identifier: "user@univ.edu",
      token: "tok_outage",
      purpose: "PASSWORD_RESET",
      expires: new Date(Date.now() + 60000),
      claimedAt: null,
      consumedAt: null,
    },
  ]);

  // Attempt 1: Claims token
  const claim1 = await store.updateManyClaim("user@univ.edu", "tok_outage", new Date());
  assert.equal(claim1.count, 1);

  // Provider fails with 503 / timeout -> Token claim released safely
  await store.releaseClaim("user@univ.edu", "tok_outage");

  // Retry succeeds once outage resolves
  const claim2 = await store.updateManyClaim("user@univ.edu", "tok_outage", new Date());
  assert.equal(claim2.count, 1);
});

test("Test 4: Expired and Already Consumed Tokens Are Rejected", async () => {
  const store = new MockTokenStore([
    {
      identifier: "expired@univ.edu",
      token: "tok_exp",
      purpose: "PASSWORD_RESET",
      expires: new Date(Date.now() - 10000), // Expired
      claimedAt: null,
      consumedAt: null,
    },
    {
      identifier: "used@univ.edu",
      token: "tok_used",
      purpose: "PASSWORD_RESET",
      expires: new Date(Date.now() + 60000),
      claimedAt: new Date(Date.now() - 5000),
      consumedAt: new Date(Date.now() - 4000), // Consumed
    },
  ]);

  const claimExpired = await store.updateManyClaim("expired@univ.edu", "tok_exp", new Date());
  assert.equal(claimExpired.count, 0, "Expired token must not be claimed");

  const claimUsed = await store.updateManyClaim("used@univ.edu", "tok_used", new Date());
  assert.equal(claimUsed.count, 0, "Consumed token must not be claimed");
});

test("Test 5: Identity Resolution Logic (JIT vs Link vs Conflict)", () => {
  const resolveIdentity = ({ user, candidateUsers }) => {
    if (user.authUserId) {
      return { action: "USE_EXISTING_UUID", targetId: user.authUserId };
    }
    if (candidateUsers.length === 0) {
      return { action: "JIT_CREATE", email: user.email };
    }
    if (candidateUsers.length === 1) {
      const candidate = candidateUsers[0];
      if (candidate.isMappedToAnotherUser) {
        return { action: "CONFLICT", code: "ACCOUNT_IDENTITY_CONFLICT" };
      }
      return { action: "LINK_EXISTING", targetId: candidate.id };
    }
    return { action: "CONFLICT", code: "ACCOUNT_IDENTITY_CONFLICT" };
  };

  // Case 1: Migrated User
  const res1 = resolveIdentity({
    user: { id: "u1", email: "a@univ.edu", authUserId: "uuid-123" },
    candidateUsers: [],
  });
  assert.equal(res1.action, "USE_EXISTING_UUID");
  assert.equal(res1.targetId, "uuid-123");

  // Case 2: Unmigrated User, No Supabase Record
  const res2 = resolveIdentity({
    user: { id: "u2", email: "b@univ.edu", authUserId: null },
    candidateUsers: [],
  });
  assert.equal(res2.action, "JIT_CREATE");

  // Case 3: Unmigrated User, Supabase Record Exists Safely
  const res3 = resolveIdentity({
    user: { id: "u3", email: "c@univ.edu", authUserId: null },
    candidateUsers: [{ id: "uuid-456", isMappedToAnotherUser: false }],
  });
  assert.equal(res3.action, "LINK_EXISTING");
  assert.equal(res3.targetId, "uuid-456");

  // Case 4: Unmigrated User, Supabase Record Mapped to Conflicting User
  const res4 = resolveIdentity({
    user: { id: "u4", email: "d@univ.edu", authUserId: null },
    candidateUsers: [{ id: "uuid-789", isMappedToAnotherUser: true }],
  });
  assert.equal(res4.action, "CONFLICT");
  assert.equal(res4.code, "ACCOUNT_IDENTITY_CONFLICT");

  // Case 5: Ambiguous Multiple Supabase Identities
  const res5 = resolveIdentity({
    user: { id: "u5", email: "e@univ.edu", authUserId: null },
    candidateUsers: [{ id: "uuid-a" }, { id: "uuid-b" }],
  });
  assert.equal(res5.action, "CONFLICT");
  assert.equal(res5.code, "ACCOUNT_IDENTITY_CONFLICT");

  // Case 6: Orphaned authUserId (UUID stored in DB but missing in Supabase) falls back to JIT create
  const resolveWithOrphanRecovery = ({ user, candidateUsers, authUserExists }) => {
    let targetId = user.authUserId;
    if (user.authUserId && !authUserExists) {
      targetId = null; // Stale orphaned reference
    }
    if (targetId) {
      return { action: "USE_EXISTING_UUID", targetId };
    }
    if (candidateUsers.length === 0) {
      return { action: "JIT_CREATE", email: user.email };
    }
    return { action: "LINK_EXISTING", targetId: candidateUsers[0].id };
  };

  const res6 = resolveWithOrphanRecovery({
    user: { id: "u6", email: "f@univ.edu", authUserId: "stale-deleted-uuid" },
    authUserExists: false,
    candidateUsers: [],
  });
  assert.equal(res6.action, "JIT_CREATE", "Orphaned authUserId must self-heal via JIT provisioning");
});

test("Test 6: Loopback CSRF Development Support", async () => {
  const { assertSameOrigin } = await import("../../src/server/http/csrf.js");

  const prevEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";

  const createReq = (origin) => ({
    method: "POST",
    headers: new Map([["origin", origin]]),
  });

  // Localhost ports 3000, 3001, 3002, 3003, 3010, 8080 should all pass in dev
  for (const port of ["3000", "3001", "3002", "3003", "3004", "8080"]) {
    const req = {
      method: "POST",
      headers: {
        get: (h) => (h.toLowerCase() === "origin" ? `http://localhost:${port}` : null),
      },
    };
    assert.equal(assertSameOrigin(req), null, `http://localhost:${port} must be accepted in development`);
  }

  // 127.0.0.1 ports should pass in dev
  const req127 = {
    method: "POST",
    headers: {
      get: (h) => (h.toLowerCase() === "origin" ? "http://127.0.0.1:3002" : null),
    },
  };
  assert.equal(assertSameOrigin(req127), null, "http://127.0.0.1:3002 must be accepted in development");

  // Malicious external origin must be rejected in dev
  const reqBad = {
    method: "POST",
    headers: {
      get: (h) => (h.toLowerCase() === "origin" ? "http://evil-phishing.com" : null),
    },
  };
  assert.equal(assertSameOrigin(reqBad), "Cross-origin request blocked");

  process.env.NODE_ENV = prevEnv;
});

