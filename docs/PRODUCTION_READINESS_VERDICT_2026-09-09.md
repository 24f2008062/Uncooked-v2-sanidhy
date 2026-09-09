# Production readiness verdict — 2026-09-09

**Target:** https://uncooked-v2.vercel.app  
**Custom domain:** `opportia.in` — not resolving  
**Commit policy:** No git commit made (per request)  
**Overall:** **NOT READY FOR PRODUCTION**

---

## 1. Verdict in one line

Ship blockers remain: **Supabase Auth misconfigured on Vercel** (dead project URL + truncated API keys) → **login/signup broken**; email provider unproven; Cloudflare/domain cutover incomplete; authenticated pen-test not done.

Code quality / unauthenticated security posture is **strong**. Local build now **passes** after fixes in this session (not deployed).

---

## 2. What was tested

| Layer | Result |
|-------|--------|
| Live health / DB | PASS — `database: ok` |
| Public pages (20+) | PASS — 200 |
| Auth-gated pages | PASS — 307 → login |
| Public APIs events/opportunities | PASS |
| Security headers | PASS (CSP, HSTS, XFO, COOP, nosniff) |
| CSRF Origin | PASS — 403 missing/evil |
| Anon authz (user + admin APIs) | PASS — 401 |
| Path traversal / junk IDs | PASS — 404, no leak |
| Login brute-force RL | PASS — 429 ~10–11 attempts |
| Forgot-password RL | PASS — 429 |
| Playwright UI smoke | ~22/23 (Help not in primary nav) |
| Contact API | PASS — 201 |
| Local `npm test` | **40/40 PASS** |
| `npm audit` (after bump) | **0 vulnerabilities** (local) |
| `npm run lint` | 0 errors / 6 warnings |
| `next build` (local, after fixes) | **PASS** |
| Login/register end-to-end | **FAIL** (Auth env) |
| Credentialed IDOR / tickets / admin | **NOT RUN** (no working auth) |

---

## 3. Critical blockers (must fix before prod)

### P0 — Supabase Auth broken (live + local keys)

| Item | Live / local finding |
|------|----------------------|
| `NEXT_PUBLIC_SUPABASE_URL` on Vercel | Still `uncooked-dev-project.supabase.co` → **NXDOMAIN** |
| Real DB project ref | `dixvabzhelffozvcpyfg` (pooler user) — Auth host **alive** |
| Anon key | Truncated (~59 chars, **2** JWT parts; need **3**) |
| Service role key | Truncated (~67 chars, **2** parts) |
| Effect | Register → `REGISTRATION_FAILED`; Login → fake `INVALID_CREDENTIALS` |

**Fix (Vercel + `.env.local`):**

```text
NEXT_PUBLIC_SUPABASE_URL=https://dixvabzhelffozvcpyfg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<FULL anon JWT from Supabase → Settings → API>
SUPABASE_SERVICE_ROLE_KEY=<FULL service_role JWT>
NEXT_PUBLIC_APP_URL=https://uncooked-v2.vercel.app   # until opportia.in live
NEXTAUTH_URL=<same as APP_URL>
```

Then **redeploy**. Confirm Authentication → Users and email confirm settings.

Local `.env.local` URL was updated to the live ref; **keys are still truncated** — paste full keys yourself (do not paste service role into chat).

### P0 — Email

Register returns `requiresEmailConfirmation: true` by design. Without Resend/SMTP, users never verify → cannot sign in even after Auth URL fix. Configure email **or** temporarily disable confirm-email in Supabase for launch.

### P0 — Deploy Auth-aware fixes + Next patch

Local (not committed / not on Vercel yet):

- Next **16.3.4** (was 16.3.2 critical advisories) — audit clean locally
- Env validation for truncated Supabase keys
- Login/register return **503 AUTH_MISCONFIGURED** instead of lying with 401 when env is bad
- `/settings` Suspense fix (build was failing)
- Removed hardcoded personal PII defaults from settings page

Until these are on Vercel with good secrets, production Auth stays broken.

---

## 4. High / medium remaining (ops & product)

Already tracked in GitHub #57–#74 (left open). Extra from this pass:

| Priority | Item |
|----------|------|
| P1 | Cloudflare WAF + bot (#60) |
| P1 | Custom domain + APP_URL cutover (#61) |
| P1 | Prove mailbox delivery for contact/reset/verify |
| P1 | Confirm Upstash used in prod (not memory-only RL) |
| P1 | Authenticated security test after login works (#72) |
| P2 | CSP `'unsafe-inline'` residual |
| P2 | Help link not in primary nav |
| P2 | ESLint warnings (`<img>`, hook deps) |
| P2 | Settings page is large (~1.6k lines) — maintainability debt |

---

## 5. Security posture (unauthenticated)

**Good:** headers, CSRF Origin, rate limits, authz fail-closed, no public PII dumps on events, uniform check-user, middleware redirects.

**Cannot certify:** session cookie hardening under real login, IDOR, ticket HMAC live, admin RBAC, erasure saga, OAuth — all need working Auth + test accounts.

---

## 6. Optimization / code quality

| Metric | Assessment |
|--------|------------|
| Unit/security tests | Solid for control plane (40 passing) |
| Build | Green locally after Suspense fix |
| Lint | Clean of errors; minor image/hook warnings |
| Deps | Local audit 0 after Next bump |
| Perf | DB health latency sometimes 1.5–2.6s — watch pooler region |
| Architecture | Security middleware + guards are coherent |
| Hot spots | Giant client pages (settings/admin) — not launch-blocking |

---

## 7. Fixes applied this session (working tree only — **not committed**)

1. `src/lib/supabase/env.js` — validate URL/keys  
2. `src/lib/supabase/client.js` / `server.js` — use validation  
3. `src/app/api/auth/login/route.js` — 503 on misconfig / upstream down  
4. `src/app/api/auth/register/route.js` — 503 on misconfig  
5. `src/app/login/page.js` — show 503 message  
6. `scripts/check-env-safety.mjs` — fail on truncated Supabase keys  
7. `.env.local` — URL → `dixvabzhelffozvcpyfg` (keys still need paste)  
8. `next@16.3.4` + audit fix  
9. `src/app/settings/page.js` — Suspense + strip hardcoded PII defaults  

---

## 8. Go / no-go checklist

- [ ] Full Supabase anon + service_role keys on Vercel  
- [ ] Correct Supabase URL on Vercel  
- [ ] Redeploy with Next 16.3.4 + Auth validation  
- [ ] Signup → verify email (or confirm-email off) → login → dashboard  
- [ ] Email provider proven  
- [ ] Smoke: register event, host apply, admin login  
- [ ] Cloudflare + domain (or accept vercel.app risk)  
- [ ] Short authenticated pen-test  

**Until the first four are done: NO-GO.**

---

## 9. What you must do next (human)

1. Open Supabase project `dixvabzhelffozvcpyfg` → copy **full** API keys.  
2. Paste into Vercel env + local `.env.local`.  
3. Say when done — we re-test login only, then authenticated flows.  
4. Decide whether to commit/deploy the local fixes from this session.
