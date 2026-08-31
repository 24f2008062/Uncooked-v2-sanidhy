/**
 * Live HTTP security suite for Uncooked APIs.
 * Expects NEXT_TEST_BASE (default http://127.0.0.1:3010)
 */
import assert from "node:assert/strict";

const BASE = process.env.NEXT_TEST_BASE || "http://127.0.0.1:3010";
const ORIGIN = process.env.NEXT_TEST_ORIGIN || "http://localhost:3000";
const EVIL = "https://evil.example";

class CookieJar {
  constructor() {
    this.store = new Map();
  }

  capture(res) {
    const cookies = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
    for (const line of cookies) {
      const pair = line.split(";", 1)[0];
      const eq = pair.indexOf("=");
      if (eq < 1) continue;
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1);
      if (value === "" || line.toLowerCase().includes("max-age=0")) {
        this.store.delete(name);
      } else {
        this.store.set(name, value);
      }
    }
  }

  header() {
    return [...this.store.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }
}

async function req(path, { method = "GET", headers = {}, body, jar, origin = ORIGIN } = {}) {
  const h = { ...headers };
  if (origin) h.Origin = origin;
  if (jar?.header()) h.Cookie = jar.header();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: h,
    body,
    redirect: "manual",
  });
  if (jar) jar.capture(res);
  let json = null;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { res, json, status: res.status };
}

async function jsonPost(path, payload, opts = {}) {
  return req(path, {
    ...opts,
    method: opts.method || "POST",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    body: JSON.stringify(payload),
  });
}

async function login(email, password) {
  const jar = new CookieJar();
  const csrf = await req("/api/auth/csrf", { jar, origin: ORIGIN });
  const csrfToken = csrf.json?.csrfToken;
  assert.ok(csrfToken, "csrf token missing");
  const body = new URLSearchParams({
    csrfToken,
    email,
    password,
    json: "true",
    redirect: "false",
    callbackUrl: ORIGIN,
  });
  const loginRes = await req("/api/auth/callback/credentials", {
    method: "POST",
    jar,
    origin: ORIGIN,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (loginRes.status >= 400) {
    throw new Error(`login failed ${loginRes.status} ${JSON.stringify(loginRes.json)}`);
  }
  const session = await req("/api/auth/session", { jar, origin: ORIGIN });
  if (!session.json?.user?.email) {
    throw new Error(`session missing after login: ${JSON.stringify(session.json)}`);
  }
  return { jar, user: session.json.user };
}

const results = [];

async function test(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`PASS  ${name}`);
  } catch (err) {
    results.push({ name, ok: false, error: err.message });
    console.error(`FAIL  ${name}`);
    console.error(`      ${err.message}`);
  }
}

const probe = await req("/api/events", { origin: null });
const dbUp = probe.status === 200;
if (!dbUp) {
  console.log(`WARN  database not reachable (GET /api/events => ${probe.status}). Authz tests still run; data-plane tests skip.`);
}

await test("unauthenticated GET /api/events is public", async () => {
  if (!dbUp) return;
  const { status, json } = await req("/api/events", { origin: null });
  assert.equal(status, 200);
  assert.equal(json.success, true);
  assert.ok(Array.isArray(json.data.events));
});

await test("unauthenticated GET /api/opportunities is public", async () => {
  if (!dbUp) return;
  const { status, json } = await req("/api/opportunities", { origin: null });
  assert.equal(status, 200);
  assert.equal(json.success, true);
});

await test("invalid event id is 404 not a traversal", async () => {
  const { status } = await req("/api/events/..%2F..%2Fetc%2Fpasswd", { origin: null });
  assert.ok(status === 404 || status === 400);
});

await test("missing event is 404", async () => {
  if (!dbUp) return;
  const { status, json } = await req("/api/events/does-not-exist-event", { origin: null });
  assert.equal(status, 404);
  assert.equal(json.success, false);
  assert.ok(!JSON.stringify(json).toLowerCase().includes("prisma"));
});

const protectedGets = [
  "/api/user/profile",
  "/api/user/export",
  "/api/registrations",
  "/api/host/apply",
  "/api/v2/admin/users",
  "/api/v2/admin/applications",
  "/api/v2/admin/dashboard/stats",
  "/api/v2/admin/incidents/kill-switch",
];

for (const path of protectedGets) {
  await test(`unauthenticated GET ${path} is 401`, async () => {
    const { status, json } = await req(path, { origin: null });
    assert.equal(status, 401);
    assert.equal(json.success, false);
  });
}

const protectedPosts = [
  ["/api/events", { title: "x" }],
  ["/api/opportunities", { title: "x" }],
  ["/api/registrations", { eventId: "ai-llm-summit", userId: "victim" }],
  ["/api/host/apply", { userId: "victim", organizationName: "x", organizationType: "College Club" }],
  ["/api/user/delete", {}],
  ["/api/user/profile", { fullName: "Hacker" }],
  ["/api/v2/admin/users/x/role", { role: "SUPER_ADMIN" }],
  ["/api/v2/admin/users/x/lock", { lock: true }],
  ["/api/v2/admin/applications/x/review", { action: "APPROVE" }],
  ["/api/v2/admin/incidents/kill-switch", { active: true }],
  ["/api/opportunities/x/apply", { note: "hi" }],
];

for (const [path, payload] of protectedPosts) {
  await test(`unauthenticated POST ${path} is 401`, async () => {
    const { status } = await jsonPost(path, payload);
    assert.equal(status, 401);
  });
}

await test("contact without Origin is blocked", async () => {
  const { status } = await jsonPost(
    "/api/contact",
    { name: "A", email: "a@b.co", message: "hello world" },
    { origin: null }
  );
  assert.equal(status, 403);
});

await test("contact from evil origin is blocked", async () => {
  const { status } = await jsonPost(
    "/api/contact",
    { name: "A", email: "a@b.co", message: "hello world" },
    { origin: EVIL }
  );
  assert.equal(status, 403);
});

await test("contact invalid JSON is 400", async () => {
  const { status } = await req("/api/contact", {
    method: "POST",
    origin: ORIGIN,
    headers: { "Content-Type": "application/json" },
    body: "{not-json",
  });
  assert.equal(status, 400);
});

await test("valid contact is stored", async () => {
  if (!dbUp) return;
  const { status, json } = await jsonPost("/api/contact", {
    name: "Campus User",
    email: "student@campus.edu",
    category: "General Inquiry",
    message: "Need help with a ticket.",
  });
  assert.equal(status, 201);
  assert.equal(json.success, true);
});

await test("register rejects short password", async () => {
  const { status } = await jsonPost(
    "/api/auth/register",
    {
      fullName: "Test User",
      email: "weak@campus.edu",
      password: "short1",
      ageAttested18: true,
      acceptTerms: true,
    },
    { headers: { "X-Forwarded-For": "203.0.113.10" } }
  );
  assert.equal(status, 400);
});

await test("register rejects missing age attestation", async () => {
  const { status } = await jsonPost(
    "/api/auth/register",
    {
      fullName: "Test User",
      email: "noage@campus.edu",
      password: "CampusHost1234",
      acceptTerms: true,
    },
    { headers: { "X-Forwarded-For": "203.0.113.11" } }
  );
  assert.equal(status, 400);
});

await test("register existing email does not leak user id or 409", async () => {
  if (!dbUp) return;
  const { status, json } = await jsonPost("/api/auth/register", {
    fullName: "Alex Rivera",
    email: "student@uncooked.edu",
    password: "StudentSecret123!",
    ageAttested18: true,
    acceptTerms: true,
  });
  assert.equal(status, 200);
  assert.equal(json.success, true);
  assert.equal(json.data.userId, undefined);
  assert.ok(!JSON.stringify(json).includes("already exists"));
});

await test("register new email uses the same success shape", async () => {
  if (!dbUp) return;
  const email = `sec-${Date.now()}@campus.edu`;
  const { status, json } = await jsonPost("/api/auth/register", {
    fullName: "Security Tester",
    email,
    password: "CampusHost1234",
    ageAttested18: true,
    acceptTerms: true,
  });
  assert.equal(status, 200);
  assert.equal(json.data.userId, undefined);
  assert.equal(json.data.message, "If this email is eligible, you can sign in with your password.");
});

let student;
let host;
let admin;

await test("student can sign in", async () => {
  if (!dbUp) return;
  student = await login("student@uncooked.edu", "StudentSecret123!");
  assert.equal(student.user.role, "USER");
});

await test("host can sign in", async () => {
  if (!dbUp) return;
  host = await login("host@uncooked.edu", "HostSecret123!");
  assert.ok(["ORGANIZER", "USER"].includes(host.user.role));
});

await test("admin can sign in", async () => {
  if (!dbUp) return;
  admin = await login("admin@uncooked.edu", "AdminSecret123!");
  assert.equal(admin.user.role, "SUPER_ADMIN");
});

await test("wrong password does not issue a session", async () => {
  await assert.rejects(() => login("student@uncooked.edu", "WrongPassword123!"));
});

await test("student cannot create events", async () => {
  if (!student) return;
  const { status } = await jsonPost(
    "/api/events",
    {
      title: "Hijack Fest",
      type: "Fest",
      date: "2026-12-01",
      location: "Nowhere",
    },
    { jar: student.jar }
  );
  assert.equal(status, 403);
});

await test("student cannot post opportunities", async () => {
  if (!student) return;
  const { status } = await jsonPost(
    "/api/opportunities",
    { title: "Fake Job", company: "Evil", type: "Internship", description: "x" },
    { jar: student.jar }
  );
  assert.equal(status, 403);
});

await test("student cannot grant SUPER_ADMIN", async () => {
  if (!student) return;
  const { status } = await jsonPost(
    `/api/v2/admin/users/${student.user.id}/role`,
    { role: "SUPER_ADMIN" },
    { jar: student.jar }
  );
  assert.ok(status === 401 || status === 403);
});

await test("student cannot read admin users", async () => {
  if (!student) return;
  const { status } = await req("/api/v2/admin/users", { jar: student.jar });
  assert.ok(status === 401 || status === 403);
});

await test("student profile does not include passwordHash", async () => {
  if (!student) return;
  const { status, json } = await req("/api/user/profile", { jar: student.jar });
  assert.equal(status, 200);
  const blob = JSON.stringify(json);
  assert.ok(!blob.includes("passwordHash"));
  assert.ok(!blob.includes("tokenVersion"));
  assert.equal(json.data.user.email, "student@uncooked.edu");
});

await test("student cannot change email or role via profile PUT", async () => {
  if (!student) return;
  const { status, json } = await jsonPost(
    "/api/user/profile",
    {
      fullName: "Alex Rivera",
      email: "root@uncooked.edu",
      role: "SUPER_ADMIN",
      passwordHash: "pwned",
    },
    { jar: student.jar, method: "PUT" }
  );
  // PUT via jsonPost helper uses POST unless method passed through req()
  void status;
  const put = await req("/api/user/profile", {
    method: "PUT",
    jar: student.jar,
    origin: ORIGIN,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Alex Rivera",
      email: "root@uncooked.edu",
      role: "SUPER_ADMIN",
    }),
  });
  assert.equal(put.status, 200);
  assert.notEqual(put.json.data.user.email, "root@uncooked.edu");
  assert.notEqual(put.json.data.user.role, "SUPER_ADMIN");
});

await test("IDOR: registration ignores attacker-supplied userId", async () => {
  if (!student || !admin) return;
  const { status, json } = await jsonPost(
    "/api/registrations",
    { eventId: "ai-llm-summit", userId: admin.user.id },
    { jar: student.jar }
  );
  assert.ok(status === 200 || status === 201);
  const profile = await req("/api/user/profile", { jar: student.jar });
  const mine = (profile.json.data.user.registrations || []).some((r) => r.eventId === "ai-llm-summit" || r.event?.id === "ai-llm-summit");
  assert.equal(mine, true);
});

await test("event detail does not list other attendees", async () => {
  if (!student) return;
  const { status, json } = await req("/api/events/ai-llm-summit", { jar: student.jar });
  assert.equal(status, 200);
  const blob = JSON.stringify(json.data.event);
  assert.ok(!blob.includes("student@uncooked.edu"));
  assert.equal(json.data.event.registrations, undefined);
});

await test("host/organizer can create an event", async () => {
  if (!host) return;
  const { status, json } = await jsonPost(
    "/api/events",
    {
      title: "Security Suite Mixer",
      type: "Workshop",
      category: "Workshops",
      date: "2026-11-01T10:00:00.000Z",
      location: "Lab 1",
      description: "Internal security test event",
      capacity: 20,
    },
    { jar: host.jar }
  );
  assert.ok(status === 201 || status === 200, `host create status ${status} ${JSON.stringify(json)}`);
  assert.ok(json.data?.event?.id);
});

await test("admin cannot assign SUPER_ADMIN via API", async () => {
  if (!admin) return;
  const users = await req("/api/v2/admin/users", { jar: admin.jar });
  assert.equal(users.status, 200);
  const studentRow = users.json.data.users.find((u) => u.email === "student@uncooked.edu");
  assert.ok(studentRow);
  const { status, json } = await jsonPost(
    `/api/v2/admin/users/${studentRow.id}/role`,
    { role: "SUPER_ADMIN" },
    { jar: admin.jar }
  );
  assert.equal(status, 400);
  assert.equal(json.success, false);
});

await test("admin can list users without hashes", async () => {
  if (!admin) return;
  const { status, json } = await req("/api/v2/admin/users", { jar: admin.jar });
  assert.equal(status, 200);
  const blob = JSON.stringify(json);
  assert.ok(!blob.includes("passwordHash"));
});

await test("errors do not leak stack traces", async () => {
  const { json } = await req("/api/events/not-a-real-event", { origin: null });
  const blob = JSON.stringify(json);
  assert.ok(!blob.toLowerCase().includes("prisma"));
  assert.ok(!blob.includes("passwordHash"));
});

await test("security headers are present", async () => {
  const { res } = await req("/login", { origin: null });
  assert.equal(res.headers.get("x-frame-options"), "DENY");
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.ok(res.headers.get("content-security-policy"));
});

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (!dbUp) {
  console.error("INCOMPLETE: start Postgres, run `npx prisma db push && npx prisma db seed`, then re-run npm run test:security");
  process.exitCode = 1;
}
if (failed.length) {
  process.exitCode = 1;
}
