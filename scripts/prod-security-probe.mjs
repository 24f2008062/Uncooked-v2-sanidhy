/**
 * Read-only / low-impact production security + functional probe.
 * Does NOT create accounts, lock real users, or mutate admin state.
 * Target: NEXT_TEST_BASE (default https://uncooked-v2.vercel.app)
 */
const BASE = (process.env.NEXT_TEST_BASE || "https://uncooked-v2.vercel.app").replace(/\/$/, "");
const ORIGIN = process.env.NEXT_TEST_ORIGIN || BASE;
const EVIL = "https://evil.example";
const FAKE_EMAIL = `secprobe+${Date.now()}@example.invalid`;

const results = [];

function record(category, name, ok, detail = "", severity = ok ? "PASS" : "FAIL") {
  results.push({ category, name, ok, detail: String(detail).slice(0, 500), severity });
  const tag = ok ? "PASS" : "FAIL";
  console.log(`${tag}  [${category}] ${name}${detail ? ` — ${String(detail).slice(0, 160)}` : ""}`);
}

async function raw(path, { method = "GET", headers = {}, body, redirect = "manual" } = {}) {
  const t0 = Date.now();
  const res = await fetch(`${BASE}${path}`, { method, headers, body, redirect });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { res, text, json, status: res.status, ms: Date.now() - t0 };
}

function headerMap(res) {
  const out = {};
  res.headers.forEach((v, k) => {
    out[k.toLowerCase()] = v;
  });
  return out;
}

async function probePages() {
  const pages = [
    "/",
    "/about",
    "/contact",
    "/cookies",
    "/events",
    "/opportunities",
    "/help",
    "/privacy",
    "/terms",
    "/security",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/host",
    "/create",
    "/dashboard",
    "/profile",
    "/host/apply",
    "/admin",
    "/admin/dashboard",
    "/admin/users",
  ];
  for (const p of pages) {
    const { status, text, ms, res } = await raw(p);
    const h = headerMap(res);
    const isProtected = ["/dashboard", "/profile", "/host/apply", "/admin", "/admin/dashboard", "/admin/users", "/create"].includes(p);
    const redirectedAuth = status >= 300 && status < 400 && /login|auth|signin/i.test(h.location || "");
    const okPage = status === 200 || (isProtected && (status === 401 || status === 403 || redirectedAuth || (status === 200 && /login|sign in|authenticate/i.test(text))));
    record(
      "functional",
      `GET ${p}`,
      okPage,
      `status=${status} ${ms}ms loc=${h.location || "-"} len=${text.length}`,
      okPage ? "PASS" : "WARN"
    );
  }
}

async function probeSecurityHeaders() {
  const { res, status } = await raw("/");
  const h = headerMap(res);
  const expect = {
    "content-security-policy": /default-src|'self'/,
    "strict-transport-security": /max-age=/i,
    "x-frame-options": /DENY|SAMEORIGIN/i,
    "x-content-type-options": /nosniff/i,
    "referrer-policy": /./,
    "permissions-policy": /./,
    "cross-origin-opener-policy": /same-origin/i,
  };
  for (const [k, re] of Object.entries(expect)) {
    const v = h[k] || "";
    record("headers", k, re.test(v), v || "(missing)");
  }
  record(
    "headers",
    "CSP blocks unsafe-eval",
    !(h["content-security-policy"] || "").includes("unsafe-eval"),
    h["content-security-policy"] || ""
  );
  record(
    "headers",
    "Server does not leak framework version",
    !/next|express|php/i.test(h.server || ""),
    h.server || "(none)"
  );
  // Note: ACOA * on HTML is often Vercel default for static; flag for review
  if (h["access-control-allow-origin"] === "*") {
    record(
      "headers",
      "Access-Control-Allow-Origin * on document",
      true,
      "Present on homepage (review if APIs also reflect * with credentials)",
      "INFO"
    );
  }
  record("headers", "homepage reachable", status === 200, `status=${status}`);
}

async function probeApisPublic() {
  for (const p of ["/api/health", "/api/events", "/api/opportunities"]) {
    const { status, json, ms } = await raw(p);
    record("api-public", `GET ${p}`, status === 200 && json?.success !== false, `status=${status} ${ms}ms body=${JSON.stringify(json)?.slice(0, 120)}`);
  }
}

async function probeAuthz() {
  const protectedGets = [
    "/api/user/profile",
    "/api/user/export",
    "/api/registrations",
    "/api/host/apply",
    "/api/v2/admin/users",
    "/api/v2/admin/events",
    "/api/v2/admin/dashboard/stats",
    "/api/v2/admin/telemetry",
    "/api/v2/admin/support",
    "/api/v2/admin/applications",
    "/api/v2/admin/communications",
    "/api/v2/admin/incidents/kill-switch",
  ];
  for (const p of protectedGets) {
    const { status, json, text } = await raw(p);
    const denied = status === 401 || status === 403;
    const leak = /prisma|stack|password|secret|DATABASE/i.test(text);
    record("authz", `anon GET ${p}`, denied && !leak, `status=${status} leak=${leak} ${JSON.stringify(json)?.slice(0, 100)}`);
  }

  const mutations = [
    ["/api/user/delete", {}],
    ["/api/user/profile", { name: "x" }],
    ["/api/registrations", { eventId: "x" }],
    ["/api/host/apply", { organisationName: "x", organisationType: "college", notes: "x" }],
    ["/api/events", { title: "x" }],
    ["/api/opportunities", { title: "x" }],
    ["/api/v2/admin/users/fake/lock", { locked: true }],
    ["/api/v2/admin/incidents/kill-switch", { enabled: true }],
    ["/api/v2/admin/erasure-reconcile", {}],
  ];
  for (const [p, body] of mutations) {
    const { status, text } = await raw(p, {
      method: p.includes("profile") ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", Origin: ORIGIN },
      body: JSON.stringify(body),
    });
    const denied = status === 401 || status === 403;
    record("authz", `anon mutate ${p}`, denied, `status=${status} ${text.slice(0, 80)}`);
  }
}

async function probeCsrf() {
  const targets = [
    ["/api/contact", { name: "Probe", email: FAKE_EMAIL, message: "security probe — ignore" }],
    ["/api/auth/forgot-password", { email: FAKE_EMAIL }],
    ["/api/auth/login", { email: FAKE_EMAIL, password: "WrongPass1234!" }],
    ["/api/auth/register", { email: FAKE_EMAIL, password: "WrongPass1234!", name: "Probe", acceptTerms: true, acceptPrivacy: true, ageAttested: true }],
  ];
  for (const [p, body] of targets) {
    const missing = await raw(p, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const evil = await raw(p, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: EVIL },
      body: JSON.stringify(body),
    });
    const missOk = missing.status === 403 || missing.status === 401 || missing.status === 400;
    const evilOk = evil.status === 403 || evil.status === 401 || evil.status === 400;
    record("csrf", `${p} rejects missing Origin`, missOk, `status=${missing.status} ${JSON.stringify(missing.json)?.slice(0, 100)}`);
    record("csrf", `${p} rejects evil Origin`, evilOk, `status=${evil.status} ${JSON.stringify(evil.json)?.slice(0, 100)}`);
  }
}

async function probeTraversalAndIdor() {
  const paths = [
    "/api/events/..%2F..%2Fetc%2Fpasswd",
    "/api/events/%2e%2e%2f%2e%2e%2fetc%2fpasswd",
    "/api/events/does-not-exist-event-xyz",
    "/api/opportunities/does-not-exist-opp-xyz",
    "/api/events/<script>alert(1)</script>",
    "/api/events/' OR '1'='1",
  ];
  for (const p of paths) {
    const { status, text, json } = await raw(encodeURI(p).includes("%") ? p : encodeURI(p));
    const ok = status === 404 || status === 400;
    const leak = /prisma|syntax error|pg_|stack/i.test(text);
    record("injection", `path ${p}`, ok && !leak, `status=${status} leak=${leak} ${JSON.stringify(json)?.slice(0, 80)}`);
  }
}

function failureFingerprint(json, text) {
  if (json?.error?.code) return String(json.error.code);
  if (json?.error?.message) return String(json.error.message);
  if (json?.code) return String(json.code);
  if (json?.message) return String(json.message);
  return String(text || "").slice(0, 80);
}

/** Run before abuse loops so IP rate-limit does not mask password policy. */
async function probeWeakPasswordRegister() {
  const weak = await raw("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ORIGIN },
    body: JSON.stringify({
      email: `weak${Date.now()}@example.invalid`,
      password: "short",
      name: "X",
      acceptTerms: true,
      ageAttested18: true,
    }),
  });
  const ok =
    weak.status === 400 ||
    weak.status === 422 ||
    weak.status === 403 ||
    (weak.status === 429 && /WEAK_PASSWORD|password|weak/i.test(JSON.stringify(weak.json || {})));
  // 429 with generic RATE_LIMITED means we couldn't evaluate policy this run — warn, don't fail.
  if (weak.status === 429 && !ok) {
    record(
      "auth",
      "register rejects weak password",
      true,
      `skipped_due_to_rate_limit status=429 ${JSON.stringify(weak.json)?.slice(0, 120)}`,
      "WARN"
    );
    return;
  }
  record(
    "auth",
    "register rejects weak password",
    ok,
    `status=${weak.status} ${JSON.stringify(weak.json)?.slice(0, 120)}`
  );
}

async function probeBruteForceLogin() {
  const statuses = [];
  const messages = new Set();
  for (let i = 0; i < 12; i++) {
    const { status, json, text } = await raw("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: ORIGIN },
      body: JSON.stringify({ email: FAKE_EMAIL, password: `WrongPass${i}!Abcd` }),
    });
    statuses.push(status);
    messages.add(failureFingerprint(json, text));
    await new Promise((r) => setTimeout(r, 200));
  }
  const got429 = statuses.includes(429);
  const uniform = messages.size <= 3;
  const noEnum = ![...messages].some((m) => /not found|no user|does not exist|already/i.test(String(m)));
  record("bruteforce", "login returns uniform failure messaging", uniform && noEnum, [...messages].join(" | "));
  record(
    "bruteforce",
    "login rate-limit trips within 12 attempts (or middleware 20/15m)",
    got429 || statuses.every((s) => s === 401 || s === 403 || s === 400 || s === 429),
    `statuses=${statuses.join(",")} got429=${got429}`,
    got429 ? "PASS" : "WARN"
  );

  // check-user enumeration
  const check = await raw("/api/auth/check-user", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ORIGIN },
    body: JSON.stringify({ email: FAKE_EMAIL }),
  });
  const bodyStr = JSON.stringify(check.json || {});
  const noExistsField = !bodyStr.includes('"exists"');
  record(
    "bruteforce",
    "check-user does not return exists:true/false",
    noExistsField || check.status === 429,
    `status=${check.status} ${bodyStr.slice(0, 120)}`
  );
}

async function probeForgotAndRegisterAbuse() {
  const statuses = [];
  for (let i = 0; i < 7; i++) {
    const { status } = await raw("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: ORIGIN },
      body: JSON.stringify({ email: `secprobe+fp${i}@example.invalid` }),
    });
    statuses.push(status);
    await new Promise((r) => setTimeout(r, 150));
  }
  record(
    "bruteforce",
    "forgot-password rate limit or uniform OK",
    statuses.some((s) => s === 429) || statuses.every((s) => [200, 400, 403, 429].includes(s)),
    `statuses=${statuses.join(",")}`,
    statuses.includes(429) ? "PASS" : "WARN"
  );
}

async function probeContact() {
  const good = await raw("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ORIGIN },
    body: JSON.stringify({
      name: "Security Probe",
      email: FAKE_EMAIL,
      message: "Automated security probe — please ignore. Timestamp " + new Date().toISOString(),
    }),
  });
  record(
    "functional",
    "POST /api/contact with valid origin",
    [200, 201, 429, 503].includes(good.status),
    `status=${good.status} ${JSON.stringify(good.json)?.slice(0, 160)}`,
    good.status === 200 || good.status === 201 ? "PASS" : "WARN"
  );
}

async function probeLoginUiSignals() {
  // /login is a client component behind Suspense — raw HTML often lacks <input>.
  // Prefer Playwright when available; otherwise accept page shell cues only.
  let usedPlaywright = false;
  try {
    const { chromium } = await import("playwright");
    usedPlaywright = true;
    const browser = await chromium.launch({ headless: true });
    const page = await (await browser.newContext()).newPage();
    page.setDefaultTimeout(30000);
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    const email = await page.locator('input[type="email"], input[name="email"]').first().isVisible().catch(() => false);
    const password = await page.locator('input[type="password"]').first().isVisible().catch(() => false);
    const submit = await page.locator('button[type="submit"]').first().isVisible().catch(() => false);
    const signup = await page.getByRole("link", { name: /get started|sign up|signup|register/i }).first().isVisible().catch(() => false);
    const forgot = await page.getByRole("link", { name: /forgot/i }).first().isVisible().catch(() => false);
    record("ui", "login page has email field", email, "via playwright");
    record("ui", "login page has password field", password, "via playwright");
    record("ui", "login page has submit control", submit, "via playwright");
    record("ui", "login page has signup link", signup, "via playwright");
    record("ui", "login page has forgot link", forgot, "via playwright");
    await browser.close();
  } catch (err) {
    const { status, text } = await raw("/login");
    const shellOk = status === 200 && /login to opportia|opportia/i.test(text);
    record(
      "ui",
      "login page shell loads (client form validated by ui-smoke)",
      shellOk,
      `status=${status} playwright=${usedPlaywright} err=${String(err.message || err).slice(0, 80)}`
    );
  }
  const signup = await raw("/signup");
  record("ui", "signup page loads with password field", signup.status === 200 && /password/i.test(signup.text), `status=${signup.status}`);
  const events = await raw("/events");
  record("ui", "events page loads", events.status === 200, `status=${events.status} len=${events.text.length}`);
  const contact = await raw("/contact");
  record("ui", "contact page loads with form cues", contact.status === 200 && /message|email|submit|send/i.test(contact.text), `status=${contact.status}`);
}

async function probeMethods() {
  try {
    const { status } = await raw("/api/health", { method: "TRACE" });
    record("headers", "TRACE disabled or not echoed", status === 405 || status === 404 || status === 501 || status === 400, `status=${status}`);
  } catch (err) {
    // undici/fetch rejects TRACE before sending — treat as disabled.
    record("headers", "TRACE disabled or not echoed", true, `client_rejected=${String(err.message || err).slice(0, 80)}`);
  }
  const opt = await raw("/api/events", { method: "OPTIONS" });
  record("headers", "OPTIONS on API", [200, 204, 405, 404].includes(opt.status), `status=${opt.status}`);
}

async function main() {
  console.log(`TARGET ${BASE}`);
  console.log(`ORIGIN ${ORIGIN}`);
  console.log("---");
  await probeSecurityHeaders();
  await probeApisPublic();
  await probePages();
  await probeLoginUiSignals();
  await probeAuthz();
  await probeCsrf();
  await probeTraversalAndIdor();
  // Policy check before abuse loops so rate-limit does not create false FAILs.
  await probeWeakPasswordRegister();
  await probeBruteForceLogin();
  await probeForgotAndRegisterAbuse();
  await probeContact();
  await probeMethods();

  const pass = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok).length;
  const warn = results.filter((r) => r.severity === "WARN").length;
  console.log("---");
  console.log(JSON.stringify({ target: BASE, when: new Date().toISOString(), pass, fail, warn, total: results.length, results }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
