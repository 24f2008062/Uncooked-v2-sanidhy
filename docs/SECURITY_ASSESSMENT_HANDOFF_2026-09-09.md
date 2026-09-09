# Opportia — Security Assessment Handoff

**Date:** 2026-09-09 (UTC)  
**Target:** https://uncooked-v2.vercel.app  
**Custom domain:** `opportia.in` / `www.opportia.in` — **DNS not resolving** (not in scope for live tests yet)  
**Prepared for:** Security / pen-test team  
**Prepared by:** Engineering (automated + manual probe)  
**App version:** `next@16.3.2` on Vercel (`bom1` / India edge)  
**Repo:** Uncooked-unfused/Uncooked-v2 (`main`)

---

## 1. Executive summary

| Area | Result |
|------|--------|
| Site availability | **UP** — homepage 200, health `database: ok` |
| Security headers | **STRONG** — CSP, HSTS preload, XFO DENY, nosniff, COOP, Permissions-Policy |
| Unauthenticated authz | **PASS** — all sampled protected APIs return 401; admin/dashboard UI redirects to login |
| CSRF (Origin) | **PASS** — missing Origin and `evil.example` → 403 on login/register/forgot/contact |
| Brute-force / rate limit | **PASS** — login hit **429** on attempts 11–12; forgot-password 429 from attempt 2 |
| Path traversal / SQLi-ish paths | **PASS** — 404, no Prisma/stack leakage |
| Public data hygiene | **PASS** — events list has no creator email / attendee arrays |
| UI smoke (Playwright) | **22/23 PASS** — forms, nav, redirects work; Help not in primary nav |
| Unit/security tests (local) | **40/40 PASS** |
| Dependency audit | **FAIL / ACTION REQUIRED** — **1 critical + 2 high** (`next`, `sharp`, `js-yaml`) |

**Bottom line for security team:** The public app is live and control-plane defenses (authz, CSRF Origin, rate limits, headers) behave as designed against unauthenticated probes. **Patch Next.js before / during the engagement.** Authenticated IDOR, privilege escalation, ticket HMAC, and erasure flows still need **credentialed** testing (accounts required). Open product/ops GitHub issues (#57–#74) remain the backlog; this report lists **additional** findings from this pass.

---

## 2. Scope of this pass

### In scope (executed)

- Passive + active unauthenticated HTTP probes against production
- Security response headers
- Public GETs: `/api/health`, `/api/events`, `/api/opportunities`
- CSRF Origin rejection on mutating auth/contact routes
- Login / forgot-password rate limiting (synthetic emails only)
- Path traversal and injection-shaped event IDs
- Anon access to user + admin APIs and page middleware redirects
- Playwright UI smoke: home, events, opportunities, login (bad password), signup/contact form presence, dashboard/admin redirects, legal pages
- Local `npm test` security unit suite (40 tests)
- `npm audit` dependency scan

### Out of scope / not completed (security team should cover)

- Authenticated USER / ORGANIZER / SUPER_ADMIN sessions
- IDOR on registrations, tickets, profile export/erase, host apply
- Ticket QR HMAC forge / replay / check-in abuse
- Kill-switch and admin role/lock mutations
- OAuth Google flow (if enabled)
- Full Burp/ZAP authenticated crawl
- Cloudflare WAF / bot score validation (not deployed yet)
- Social engineering, physical, or supplier review
- Destructive load testing beyond light rate-limit probes

**Test accounts needed from engineering (recommend creating dedicated disposable ones):**

| Role | Purpose |
|------|---------|
| USER | Register for events, profile, export, erase dry-run |
| ORGANIZER | Create event/opportunity, scanner check-in |
| SUPER_ADMIN | Admin panel, KYC review, kill-switch (careful) |

---

## 3. Environment & footprint

| Item | Value |
|------|--------|
| Production URL | https://uncooked-v2.vercel.app |
| Homepage title | `Opportia Portal: Delightful Campus Events Start Here` |
| Health (sample) | `{"success":true,"data":{"status":"ok","database":"ok","latencyMs":~1400–1600}}` |
| Public events | **15** listed (sample host fields only; no creator email) |
| Public opportunities | Present (API 200) |
| Server | `Vercel` (no framework version leak) |
| Region hint | `X-Vercel-Id: bom1::...` |

---

## 4. Security headers (homepage + `/api/health`)

| Header | Observed | Verdict |
|--------|----------|---------|
| Content-Security-Policy | `default-src 'self'; script-src 'self' 'unsafe-inline'; …; frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests` | PASS (note: `'unsafe-inline'` residual risk) |
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` | PASS |
| X-Frame-Options | `DENY` | PASS |
| X-Content-Type-Options | `nosniff` | PASS |
| Referrer-Policy | `strict-origin-when-cross-origin` | PASS |
| Permissions-Policy | `camera=(), microphone=(), geolocation=(), payment=()` | PASS |
| Cross-Origin-Opener-Policy | `same-origin` | PASS |
| CSP `unsafe-eval` | Absent | PASS |
| Access-Control-Allow-Origin | `*` on **HTML document** | INFO — confirm APIs never combine `*` with credentialed responses |

---

## 5. Authentication & abuse controls

### 5.1 Login brute-force (synthetic)

- Endpoint: `POST /api/auth/login` with valid `Origin: https://uncooked-v2.vercel.app`
- Fake email: `secprobe+<ts>@example.invalid`
- **Statuses:** `401 × 10`, then **`429 × 2`**
- Rate-limit message: `RATE_LIMITED` / “Too many requests…”
- **Verdict:** Rate limiting is active and trips within ~11 attempts from one IP.

### 5.2 Forgot-password abuse

- 7 rapid posts → first `200`, then **`429`** thereafter  
- **Verdict:** Tight limit (aligns with ~5/15m design).

### 5.3 User enumeration

- `POST /api/auth/check-user` returned `{"success":true,"data":{"ok":true}}` — **no `exists` boolean**
- **Verdict:** PASS against classic enumeration via that endpoint.

### 5.4 CSRF / Origin

| Route | Missing Origin | Evil Origin |
|-------|----------------|-------------|
| `/api/contact` | 403 Missing Origin | 403 Cross-origin blocked |
| `/api/auth/forgot-password` | 403 | 403 |
| `/api/auth/login` | 403 | 403 |
| `/api/auth/register` | 403 | 403 |

### 5.5 Weak password register

- Probe returned **429** (shared IP still limited) — weak-password rejection covered by **local unit tests**; re-check from clean IP during engagement.

---

## 6. Authorization (unauthenticated)

All of the following returned **401** `UNAUTHENTICATED` with no stack/Prisma leak:

**GET:** `/api/user/profile`, `/api/user/export`, `/api/registrations`, `/api/host/apply`, `/api/v2/admin/users`, `/api/v2/admin/events`, `/api/v2/admin/dashboard/stats`, `/api/v2/admin/telemetry`, `/api/v2/admin/support`, `/api/v2/admin/applications`, `/api/v2/admin/communications`, `/api/v2/admin/incidents/kill-switch`

**Mutations (POST/PUT):** `/api/user/delete`, `/api/user/profile`, `/api/registrations`, `/api/host/apply`, `/api/events`, `/api/opportunities`, `/api/v2/admin/users/fake/lock`, `/api/v2/admin/incidents/kill-switch`, `/api/v2/admin/erasure-reconcile`

**UI middleware:**

| Path | Result |
|------|--------|
| `/dashboard`, `/profile`, `/create`, `/host/apply` | **307** → `/login?redirectTo=…` |
| `/admin`, `/admin/dashboard`, `/admin/users` | **307** → `/login?redirectTo=…` |

---

## 7. Injection / traversal

| Probe | Result |
|-------|--------|
| `/api/events/..%2F..%2Fetc%2Fpasswd` | 404 NOT_FOUND, no leak |
| Encoded `../` variants | 404 |
| Missing event/opportunity IDs | 404 |
| `<script>alert(1)</script>` in path | 404 |
| `' OR '1'='1` in path | 404 |

Public event JSON keys (sample): `id,title,type,category,tags,date,location,zone,city,state,country,description,schedule,prizePool,bannerUrl,ticketType,price,capacity,waitlistEnabled,status,hostName,registrationCount,spotsLeft` — **no creator email, no attendee list**.

---

## 8. Functional / UI smoke (Playwright)

Evidence screenshots: `docs/security-evidence/*.png`  
JSON: `docs/security-evidence/ui-smoke-results.json`

| Check | Result |
|-------|--------|
| Home loads (Opportia branding) | PASS |
| Nav: Events, Opportunities, About, Contact | PASS |
| Nav: Help | **FAIL** — not in primary nav (page `/help` still **200** via direct URL) |
| Events page + cards/links | PASS (33 content nodes) |
| Opportunities page | PASS |
| Login email/password/submit | PASS |
| Bad password UX | PASS (form submits; rate-limit/error path active) |
| Signup + contact submit controls | PASS |
| Anon dashboard/admin → login | PASS |
| `/privacy`, `/terms`, `/security`, `/cookies` substance | PASS |
| `POST /api/contact` (valid Origin) | **201** received |

**Public pages HTTP 200:** `/`, `/about`, `/contact`, `/cookies`, `/events`, `/opportunities`, `/help`, `/privacy`, `/terms`, `/security`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/host`

---

## 9. Automated regression (local)

```
npm test → 40/40 pass
```

Covers: password policy, rate-limit memory/async, HMAC tickets, open-redirect hardening, RBAC helpers, CSP/image remotePatterns, check-user non-enumeration, migrate-login uniformity, email fail-closed, CSRF unit, etc.

Production HTTP suite (`npm run test:security`) expects a local seeded server — run during staging with `NEXT_TEST_BASE`.

---

## 10. Dependency vulnerabilities (`npm audit`) — **not in GitHub issues previously as CVEs**

| Package | Severity | Advisory | Notes |
|---------|----------|----------|-------|
| **next@16.3.2** | **Critical** | [GHSA-p293-qw3h-jr36](https://github.com/advisories/GHSA-p293-qw3h-jr36) Windows RCE; [GHSA-2xp9-vwfh-vxw4](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4) Image Optimization AVIF RCE | Hosted on **Vercel (Linux)** → Windows RCE likely N/A; **AVIF image opt still relevant**. Upgrade to **≥ 16.3.4**. |
| **sharp@0.35.3** | High | libheif advisories via sharp | `npm audit fix` → ≥ 0.35.4 |
| **js-yaml@4.3.1** | High | CPU DoS via merge keys | Transitive via ESLint tooling — lower prod runtime risk; still patch |

**Recommended immediate eng action:** bump `next` to patched release and redeploy before deep pen-test.

---

## 11. What is working (controls summary)

1. Production app + Postgres reachable  
2. Strong baseline HTTP security headers  
3. Session-gated UI routes  
4. API fail-closed without auth  
5. Origin-based CSRF on key mutations  
6. Login + forgot-password rate limits trip under abuse  
7. Uniform non-existence responses on check-user  
8. Public catalog APIs without attendee/creator email dumps  
9. Contact form end-to-end acceptance (201)  
10. Legal/security/cookie pages published under Opportia branding  
11. Local security unit suite green  

---

## 12. Still to do — **outside** the open GitHub epic (#57–#74)

Leave #57–#74 as-is. Additional items from **this** assessment:

| Priority | Item | Why |
|----------|------|-----|
| **P0** | Upgrade `next` (≥16.3.4) and redeploy | Critical advisory (image opt RCE) |
| **P0** | Upgrade `sharp` (≥0.35.4) | High advisory |
| **P0** | Issue disposable pen-test accounts (USER / ORGANIZER / SUPER_ADMIN) + document passwords via 1Password | Credentialed testing blocked otherwise |
| **P1** | Confirm production Upstash Redis env (not memory fallback) under load | Rate-limit durability across instances |
| **P1** | Confirm transactional email really delivers (signup / reset / contact) | Ops risk; contact API accepted message but mailbox proof needed |
| **P1** | Security team: authenticated Burp crawl + IDOR matrix | Highest residual risk area |
| **P1** | Security team: ticket HMAC / check-in replay tests | Core trust boundary |
| **P2** | Re-evaluate CSP `'unsafe-inline'` (nonces/hashes if feasible) | XSS residual |
| **P2** | Clarify `Access-Control-Allow-Origin: *` on documents vs APIs | CORS hygiene |
| **P2** | Add Help to primary nav or accept footer-only | UX finding only |
| **P2** | Patch `js-yaml` via `npm audit fix` | Tooling DoS |
| **Info** | Do not treat raw `*.vercel.app` as final prod hostname | Prefer Cloudflare + `opportia.in` (#60/#61) |

GitHub already tracks go-live (schema, env, email, Cloudflare, domain, smoke), product, compliance, pen-test epic (#72), etc. — **do not duplicate those tickets**; use this table for CVE/patch + engagement prep only.

---

## 13. Suggested security-team test plan (next)

1. **Patch window** — eng ships Next/sharp bump; retest headers + health.  
2. **Account kit** — three roles + one locked user + one pending host application.  
3. **AuthN** — credential stuffing (expect 429/lock), password reset token handling, session fixation, cookie flags (`Secure`, `HttpOnly`, `SameSite`).  
4. **AuthZ / IDOR** — swap IDs on registrations, export, erase, apply, admin objects; expect 401/403/404 without data leak.  
5. **Tickets** — forge HMAC, swap `registrationId`/`eventId`/`userId`, replay check-in.  
6. **Admin** — kill-switch, role change, lock, communications broadcast (staging preferred).  
7. **Edge** — after Cloudflare (#60): bot score, WAF SQLi/XSS rules, origin IP concealment.  
8. **Report** — map findings to OWASP ASVS / OWASP Top 10; retest after fixes.

---

## 14. Evidence artifacts

| Artifact | Path / URL |
|----------|------------|
| This report | `docs/SECURITY_ASSESSMENT_HANDOFF_2026-09-09.md` |
| HTTP probe script | `scripts/prod-security-probe.mjs` |
| UI smoke script | `scripts/prod-ui-smoke.mjs` |
| Screenshots + UI JSON | `docs/security-evidence/` |
| Internal rules | `docs/SECURITY_TEST.md`, `SECURITY.md` |
| Live target | https://uncooked-v2.vercel.app |

---

## 15. Sign-off snapshot

```
Target:     https://uncooked-v2.vercel.app
When:       2026-09-09
Unit tests: 40/40 PASS
UI smoke:   22/23 PASS (Help nav only)
HTTP authz/CSRF/headers/traversal: PASS
Login RL:   429 at ~11th attempt
npm audit:  1 critical (next), 2 high (sharp, js-yaml)
Domain:     opportia.in NOT LIVE
WAF:        not verified (pending #60)
AuthZ deep: PENDING (needs accounts)
```

**Engineering recommendation:** Share this document + evidence folder with the security team; create test accounts; **patch Next.js immediately**; then start credentialed testing against the Vercel URL until Cloudflare + custom domain cutover.
