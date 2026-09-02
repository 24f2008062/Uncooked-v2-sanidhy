# Uncooked — Security Architecture

**Product:** Uncooked campus events platform  
**Owner:** Engineering  
**Updated:** 2 September 2026  
**Repo:** [Uncooked-unfused/Uncooked-v2](https://github.com/Uncooked-unfused/Uncooked-v2)

**Related docs**

| Doc | Role |
| --- | --- |
| [docs/SECURITY_TEST.md](./docs/SECURITY_TEST.md) | Mandatory pre-ship checklist + how to run harnesses |
| [docs/IT_ACT_INDIA.md](./docs/IT_ACT_INDIA.md) | DPDP / IT Act mapping |
| [docs/DESIGN.md](./docs/DESIGN.md) | UI trust rules (no fake claims, no leaked PII) |
| [docs/BLUE_OCEAN.md](./docs/BLUE_OCEAN.md) | Product bets that security must not contradict |

This file is the **map of how Uncooked is secured end-to-end**: pages, buttons/actions, APIs, rate limits, cookies, headers, tickets, and data rights. If code and this doc disagree, **fix the code, then update this doc in the same PR**.

---

## 1. Threat model (what we defend)

| Threat | Primary controls |
| --- | --- |
| Account takeover | scrypt passwords, lockout, HTTP-only cookies, `tokenVersion` |
| Session forgery | Strong `NEXTAUTH_SECRET` (no weak/placeholder secrets) |
| CSRF / cross-site writes | Origin allowlist + `SameSite=Lax` cookies + mutation guards |
| IDOR / privilege escalation | DB-backed `getCurrentUser()`, role checks, no client-trusted `userId`/`role` |
| Brute force / spam | Per-route + middleware rate limits |
| Ticket forgery | HMAC-SHA256 with dedicated `TICKET_HMAC_SECRET` |
| XSS / clickjacking | React escaping, CSP, `X-Frame-Options: DENY` |
| Data abuse (DPDP) | Export/erase scoped to session user; audit logs |
| Platform emergency | Kill switch pauses writes |

---

## 2. Secrets & configuration

| Variable | Rule |
| --- | --- |
| `NEXTAUTH_SECRET` | ≥ 32 random chars. Never commit. Reject placeholders like `dev_secret`, `change-me`, `fallback`. |
| `TICKET_HMAC_SECRET` | ≥ 32 chars, **different** from session secret. Signs QR passes. |
| `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` | Drive CSRF Origin allowlist in production. |
| `DATABASE_URL` | Postgres only; never log connection strings with credentials. |

- `.env*` is gitignored; commit **`.env.example`** with placeholders only (when present).
- No API keys, HMAC secrets, or passwords in source, chat, or screenshots.
- Rotate any secret that was ever committed or pasted.

**Code:** `src/lib/auth.js`, `src/server/tickets/hmac.js`, `src/server/http/csrf.js`

---

## 3. Global HTTP security headers

Applied to all routes via `next.config.mjs`:

| Header | Value / intent |
| --- | --- |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` (no clickjacking) |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Permissions-Policy` | camera/microphone/geolocation/payment disabled |
| `Content-Security-Policy` | `default-src 'self'`; images limited to self + Unsplash + ui-avatars; `frame-ancestors 'none'`; `object-src 'none'` |
| `X-Powered-By` | Disabled (`poweredByHeader: false`) |

**Note:** CSP still allows `'unsafe-inline'` / `'unsafe-eval'` for Next.js. Tighten with nonces when the stack allows — tracked as a follow-up.

---

## 4. Authentication & sessions

| Control | Detail |
| --- | --- |
| Provider | NextAuth **Credentials** → JWT strategy |
| Cookie (dev) | `uncooked.session-token` |
| Cookie (prod) | `__Secure-uncooked.session-token` |
| Flags | `httpOnly`, `sameSite: lax`, `secure` in production |
| Max age | **7 days** (`SESSION_MAX_AGE_SEC`) |
| Password hash | **scrypt** only (`N=16384`); reject plaintext / unknown formats |
| Password policy | Min **12** chars, letter + number, max 128 |
| Login failures | Uniform `INVALID_CREDENTIALS` (no user enumeration) |
| Lockout | **8** failures → lock **30 minutes** |
| Session kill | Increment `tokenVersion` on password reset, role change, lock, erase; `getCurrentUser()` rejects mismatched `ver` |
| Google OAuth | Hidden until `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` + real client IDs |

**Code:** `src/lib/auth.js`, `src/server/utils/passwordUtils.js`, `src/server/auth/authentication.js`, `src/server/config/authCookies.js`, `src/server/config/legal.js`

---

## 5. Middleware — page & API gate

**File:** `src/middleware.js` (Edge-safe: no Prisma / Node crypto)

| Path pattern | Rule |
| --- | --- |
| `/admin`, `/api/v2/admin/**` | JWT must exist and `role === SUPER_ADMIN` |
| `/dashboard`, `/profile`, `/host/apply` | Session required → else redirect `/login?redirectTo=…` |
| `POST /api/auth/*` | Rate limit **20 / 15 min / IP** |
| Other mutating `/api/*` (not auth, not contact) | Session required or **401** |
| `/api/contact` | Public mutation (still CSRF + rate limited in handler) |

Missing / weak `NEXTAUTH_SECRET` must **fail closed** (do not skip `/admin` page checks). Hardening lives in PR [#8](https://github.com/Uncooked-unfused/Uncooked-v2/pull/8).

Login `redirectTo` must be a **same-app relative path** only (block `//evil.com`, schemes, backslashes). Use `safeInternalPath` when that helper is merged.

---

## 6. Mutation stack (every write)

All app-owned `POST` / `PUT` / `PATCH` / `DELETE` (except NextAuth internals) go through:

```text
enforceMutationGuards(req, { rateKey, limit, windowMs, skipKillSwitch? })
  → assertSameOrigin (CSRF)
  → rateLimit(rateKey + hashed IP)
  → kill switch (unless skipKillSwitch)
→ requireUser / requireRoles / requireSuperAdmin as needed
→ validate body (whitelist fields, length caps)
→ Prisma (parameterized) + audit where sensitive
→ jsonOk / jsonError / safeError (no stack / Prisma leaks)
```

**Code:** `src/server/http/guards.js`, `csrf.js`, `rateLimit.js`, `envelope.js`, `ip.js`

### CSRF / Origin

- Non-GET methods require `Origin` in the allowlist from `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` / `APP_URL`.
- Dev also allows `http://localhost:3000` and `http://127.0.0.1:3000`.
- Production with empty allowlist → reject (“Origin check is not configured”).
- Missing Origin: only accept when `Sec-Fetch-Site: same-origin` (do not trust bare `none` once PR #8 is merged).

### Kill switch

- When active, mutations return **503** `KILL_SWITCH`.
- Toggle endpoint uses `skipKillSwitch: true` so admins can turn it off.
- Prefer fail-closed on settings read errors for write paths (PR #8).

---

## 7. Rate limits (do not loosen without review)

Limiter: process-local fixed window (`src/server/http/rateLimit.js`). On multi-instance / serverless each isolate has its own Map — still blunts casual abuse; use Redis/Upstash for hard cross-instance guarantees later.

| Surface | Key | Limit | Window |
| --- | --- | --- | --- |
| Middleware NextAuth POST | `mw_auth:{ip}` | 20 | 15 min |
| Register | `rl_auth_register` | 5 | 15 min |
| Forgot password | `rl_auth_forgot` | 5 | 15 min |
| Reset password | `rl_auth_reset` | 5 | 15 min |
| Contact form | `rl_contact` | 5 | 1 hour |
| GET `/api/events` | `rl_events_get` | 60 | 1 min |
| GET `/api/opportunities` | `rl_opp_get` | 60 | 1 min |
| Create event | `rl_event_create` | 10 | 1 hour |
| Create opportunity | `rl_opp_create` | 10 | 1 hour |
| Register for event | `rl_register_event` | 20 | 1 hour |
| Apply to opportunity | `rl_opp_apply` | 10 | 1 hour |
| Host apply | `rl_host_apply` | 5 | 1 hour |
| Profile update | `rl_profile` | 20 | 1 hour |
| Account erase | `rl_user_delete` | 3 | 1 hour |
| Admin user/role/lock/review | `rl_admin` | 30 | 1 min |
| Kill-switch toggle | `rl_admin_kill` | 10 | 1 min |
| User data export | `rl_user_export` | 5 / user / hour | *(PR #8)* |

429 responses include `Retry-After` and `X-RateLimit-Remaining` when the limiter trips.

---

## 8. API inventory — who can call what

Legend: **Anon** | **USER** | **ORG** (ORGANIZER) | **SA** (SUPER_ADMIN)

### Public / auth

| Method | Path | Auth | Guards |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Anon | CSRF + RL; always creates `role: USER`; anti-enumeration message |
| POST | `/api/auth/[...nextauth]` | Anon | Middleware RL; NextAuth CSRF |
| POST | `/api/auth/forgot-password` | Anon | CSRF + RL; generic response; **never** return reset token in production |
| POST | `/api/auth/reset-password` | Anon | CSRF + RL; consume one-time token; bump `tokenVersion` |
| POST | `/api/contact` | Anon+ | CSRF + RL; category allowlist; message length cap |
| GET | `/api/events` | Anon+ | RL; public projection only |
| GET | `/api/events/[id]` | Anon+ | Valid event id; no attendee PII |
| GET | `/api/opportunities` | Anon+ | RL; public projection |

### Authenticated user

| Method | Path | Auth | Guards |
| --- | --- | --- | --- |
| GET/PUT | `/api/user/profile` | Self | CSRF on PUT; field whitelist (no role/email/password mass assignment) |
| GET | `/api/user/export` | Self | DPDP export; audit `USER_EXPORT` |
| POST | `/api/user/delete` | Self | CSRF + RL; erasure + `tokenVersion`; **password step-up in PR #8** |
| GET/POST | `/api/registrations` | Self | CSRF on POST; own rows only; HMAC ticket for owner |
| GET/POST | `/api/host/apply` | USER+ | CSRF; cannot self-approve |
| POST | `/api/opportunities/[id]/apply` | Self | CSRF; own application |

### Organizer

| Method | Path | Auth | Guards |
| --- | --- | --- | --- |
| POST | `/api/events` | ORG / SA | CSRF + RL; capacity/price sanitized |
| POST | `/api/opportunities` | ORG / SA | CSRF + RL |

### Super admin (`/api/v2/admin/**`)

| Method | Path | Guards |
| --- | --- | --- |
| GET | `/api/v2/admin/dashboard/stats` | `requireSuperAdmin` + middleware |
| GET | `/api/v2/admin/users` | SA |
| POST | `/api/v2/admin/users/[id]/lock` | SA; cannot break invariants; bumps `tokenVersion` |
| POST | `/api/v2/admin/users/[id]/role` | SA; **USER \| ORGANIZER only** — cannot grant `SUPER_ADMIN`; cannot change own role |
| GET/POST | `/api/v2/admin/applications` + `[id]/review` | SA; KYC approve elevates to ORGANIZER + `tokenVersion` |
| GET/POST | `/api/v2/admin/incidents/kill-switch` | SA; POST uses `skipKillSwitch` |

**IDOR rule:** if the resource is not theirs, return **404**, not a detailed 403.

---

## 9. Pages & UI actions (buttons / forms)

Security is not only APIs — every sensitive **button** must hit a guarded route and never trust the browser alone.

### Public pages

| Page | Sensitive actions | Protection |
| --- | --- | --- |
| `/` | Aura chat | Client FAQ only; no passwords; no voice call; no privilege |
| `/events`, `/events/[id]` | Register / Get pass | Requires session; `POST /api/registrations` |
| `/opportunities` | Apply | Session + `POST …/apply` |
| `/host` | CTA → apply | `/host/apply` is auth-gated by middleware |
| `/login` | Sign in | Credentials; uniform errors; safe `redirectTo` |
| `/signup` | Create account | `POST /api/auth/register` + age/terms checkboxes |
| `/forgot-password`, `/reset-password` | Reset flow | Tokenized; rate limited |
| `/contact` | Send message | CSRF + RL + validation |
| `/privacy`, `/terms`, `/security`, `/cookies` | Informational | No privileged mutations |
| Aura widget | Quick actions / send | Chat-only ideology; refuses calls; never asks for passwords |

### Account pages (middleware session required)

| Page | Buttons / forms | Protection |
| --- | --- | --- |
| `/dashboard` | View passes / apps | Data from authenticated APIs only |
| `/profile` | Save profile | Whitelisted PUT fields |
| `/profile` | Export my data | `GET /api/user/export` (self) |
| `/profile` | Erase my account | `POST /api/user/delete` (+ password confirm when PR #8 merged) |
| `/host/apply` | Submit KYC | Rate limited; pending until admin review |

### Admin console (`/admin/**`)

| Page | Actions | Protection |
| --- | --- | --- |
| Layout / all admin UI | Load data | Middleware SA + APIs `requireSuperAdmin`; **fail closed** on 401/403/error (never authorize in `catch`) |
| Users | Lock / role | Cannot grant SA; cannot self-target where blocked |
| Applications | Approve / reject / info | Transactional; audit events |
| Incidents | Kill switch | SA only; audited |

Navbar “Events” goes to `/events`, not `/dashboard`. Dashboard/Profile links only when signed in.

---

## 10. Tickets (QR / HMAC)

| Rule | Detail |
| --- | --- |
| Canonical string | `registrationId.eventId.userId` |
| Algorithm | HMAC-SHA256 → base64url |
| Verify | `timingSafeEqual` |
| Display | Owner only (registration GET / event detail after register) |
| Forbidden | Client-invented `sig`, truncations like `id.slice(0, 8)` |
| Event IDs | `^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$` — reject path traversal |

**Code:** `src/server/tickets/hmac.js`, `src/server/services/eventsPublic.js`

Public event JSON: host display name, spots left — **never** creator email or attendee lists.

---

## 11. Data protection (DPDP-shaped)

| Control | Where |
| --- | --- |
| 18+ attestation + Terms/Privacy versions | Register + legal config |
| Consent rows with IP hash | Register |
| Export | `/api/user/export` → `exportUserPayload` |
| Erasure | `/api/user/delete` → `eraseUser` (nulls PII, bumps `tokenVersion`) |
| Audit | `logAuditEvent` on export, erase, role, lock, KYC, kill-switch, event create |
| IP storage | Hashed with secret pepper (`hashIp`) — not raw IPs in consent/audit where hashed |

See [docs/IT_ACT_INDIA.md](./docs/IT_ACT_INDIA.md).

---

## 12. Input validation & injection

- JSON body: object only (`readJson`); invalid → **400**.
- Strings: trim + max length per field (names, messages, titles, descriptions).
- Emails: regex + length cap; lowercased.
- Prisma Client only — **no** string-built SQL for app queries.
- Registration capacity: prefer row lock (`SELECT … FOR UPDATE`) when merged (PR #8) to prevent overbooking races.
- Errors: `safeError` maps DB outages to **503**; never returns stacks to clients.

---

## 13. Roles & privilege rules

| Role | Can |
| --- | --- |
| `USER` | Discover, RSVP, apply to jobs, apply to host, manage own profile/data |
| `ORGANIZER` | Everything USER + create events/opportunities |
| `SUPER_ADMIN` | Admin console, KYC, lock, role USER↔ORGANIZER, kill switch |

- JWT `role` is a **hint**; handlers re-read DB user + `tokenVersion`.
- `SUPER_ADMIN` is **seed / controlled DB only** — not grantable from the console (`ASSIGNABLE_ROLES`).

---

## 14. What we deliberately do **not** claim

Aligned with DESIGN / Blue Ocean (do not put these in UI, Aura, or marketing):

- Fake campus counts, fake uptime, PCI-DSS, completed pen tests  
- `.edu` auto-verify, SMS OTP, Apple/Google Wallet, native scanner app (until built)  
- Aura as a free-form LLM or **voice calling** agent  

---

## 15. How to verify

```bash
npm test
# With Postgres seeded + app on :3010:
# set NEXT_TEST_BASE=http://127.0.0.1:3010
npm run test:security
```

Harnesses: `tests/security/unit.test.mjs`, `tests/security/http-suite.mjs`, plus redirect/secrets/Aura tests when present on the branch.

Before every release, complete the checkbox gate in [docs/SECURITY_TEST.md](./docs/SECURITY_TEST.md).

---

## 16. Incident & ops notes

1. **Suspected session leak** — rotate `NEXTAUTH_SECRET`, bump all `tokenVersion` (or force password resets), review audit log.  
2. **Ticket forge suspicion** — rotate `TICKET_HMAC_SECRET`, re-issue passes.  
3. **Active abuse** — enable kill switch (`/admin` incidents); writes pause.  
4. **Dependency CVEs** — `npm audit`; prefer overrides over `--force` Prisma downgrades.

---

## 17. Open hardening (track in PRs)

| Item | Status |
| --- | --- |
| Remove hardcoded NextAuth secret fallback; middleware fail-closed | PR [#8](https://github.com/Uncooked-unfused/Uncooked-v2/pull/8) |
| Open-redirect hardening + erase password step-up + FOR UPDATE capacity | PR #8 |
| Aura chat-only / honest ideology | PR [#9](https://github.com/Uncooked-unfused/Uncooked-v2/pull/9) |
| Shared Redis rate limits | Not started |
| CSP nonces / drop `unsafe-eval` | Not started |
| Expiring ticket HMAC + door scanner burn | Product phase 1 |

When those PRs merge, update the tables above in the same follow-up commit if anything drifted.

---

*Security is a property of the whole system: every page, every button, every API, every rate limit. If you add a write path without `enforceMutationGuards` + authz + validation, you are shipping a hole — do not merge it.*
