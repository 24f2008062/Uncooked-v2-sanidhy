# Uncooked — Security Test & Rules (follow every time)

**Owner:** Engineering  
**Product:** Uncooked campus events platform  
**Updated:** 27 August 2026  
**Related:** [IT_ACT_INDIA.md](./IT_ACT_INDIA.md), [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md)

This is the **mandatory** security list. Follow it on every feature, every API, every release. Do not ship if any item in [Pre-ship gate](#pre-ship-gate) is unchecked.

Run the automated suite before merge:

```bash
npm test
# With Postgres running and seeded:
npx prisma db push
npx prisma db seed
npx next dev -p 3010 -H 127.0.0.1
# other terminal:
set NEXT_TEST_BASE=http://127.0.0.1:3010
npm run test:security
```

Harness: `tests/security/unit.test.mjs` and `tests/security/http-suite.mjs`.

---

## 1. Secrets — never in git

- No API keys, JWT secrets, DB passwords, or HMAC keys in source.
- `NEXTAUTH_SECRET` must be ≥ 32 random characters. **No fallback.** Boot must fail if missing or if it contains `dev_secret` / `change-me`.
- `TICKET_HMAC_SECRET` is separate from the session secret.
- `.env*` is gitignored. Commit only `.env.example` with placeholders.
- Rotate any secret that was ever committed or pasted in chat.

---

## 2. Authentication

- One session system: NextAuth JWT cookies (HTTP-only, `SameSite=Lax`, `Secure` in production).
- Cookie names: `uncooked.session-token` locally; `__Secure-uncooked.session-token` in production.
- Max session age: **7 days**.
- Login failures: same message (`INVALID_CREDENTIALS`). Never leak “user exists”, Prisma, or lock status.
- After **8** failed logins, lock **30 minutes**.
- Password: **scrypt only**, min **12** characters, letter + number. Never compare plaintext.
- Password change, admin lock, role change, and account erasure must increment `tokenVersion` so old cookies die.
- Google OAuth button stays hidden until `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` and real client IDs exist.
- Do not log emails, passwords, or hashes.

---

## 3. Authorization (every mutating route)

- Never trust `userId` / `role` from the client body. Use `getCurrentUser()` from the session, then the **database** user.
- JWT role is a hint. Handlers re-check DB role and `tokenVersion`.
- `SUPER_ADMIN` cannot be granted from the admin console. Seed / controlled DB grant only.
- Middleware: `/admin` and `/api/v2/admin` require `SUPER_ADMIN`. `/dashboard`, `/profile`, `/host/apply` require a session.
- Middleware must stay **Edge-safe** (no Node `crypto`, no Prisma).
- Admin UI must **fail closed** (deny on 401/403/error). Never `setAuthorized(true)` in `catch`.

### Who may call what

| Action | Anon | USER | ORGANIZER | SUPER_ADMIN |
| :--- | :---: | :---: | :---: | :---: |
| GET public events / opportunities | yes | yes | yes | yes |
| POST contact | yes (CSRF + rate limit) | yes | yes | yes |
| Register / login / forgot / reset | yes | — | — | — |
| Register for event / apply to job / host apply | no | yes (self only) | yes | yes |
| Create event / create opportunity | no | no | yes | yes |
| Read/update own profile, export, erase | no | self | self | self |
| Admin users, KYC review, kill-switch | no | no | no | yes |

IDOR rule: if the resource is not theirs, return **404**, not 403 with details.

---

## 4. CSRF, origin, rate limits

- Every **POST/PUT/PATCH/DELETE** (except NextAuth’s own CSRF) must run `enforceMutationGuards`.
- Reject missing `Origin` and origins that are not `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` (plus localhost in development only).
- Rate limits (current floors — do not loosen without a review):
  - Register / forgot / reset: 5 / 15 min / IP
  - NextAuth POST (`/api/auth/*`): 20 / 15 min / IP (middleware)
  - Contact: 5 / hour / IP
  - Public GET lists: 60 / min / IP
  - Generic writes: 10–30 / hour or / min as coded per route
- Kill-switch pauses **writes**. The kill-switch **toggle** itself must use `skipKillSwitch: true`.
- Invalid JSON → **400**, never 500.

---

## 5. Tickets and IDs

- QR payload is HMAC-SHA256 of `registrationId.eventId.userId` with `TICKET_HMAC_SECRET`.
- **Forbidden:** `sig = id.slice(0, 8)` or any client-invented signature.
- Event IDs must match `^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$`. Path traversal → 404.
- Public event JSON: no attendee list, no creator email, no other users’ PII. `spotsLeft` only.
- Ticket QR is shown only to the owner.

---

## 6. Input, XSS, SQL

- Prisma parameterized queries only. No string-built SQL.
- Allow-list fields. Never spread `req.json()` into Prisma `data`.
- Cap string lengths (name 80, notes 2000, description 5000, search 80).
- Resume/portfolio URLs: `https://` only.
- Host apply: organisation name, type, notes. **No document uploads, no Aadhaar/PAN.**
- Render user text as React text. No `dangerouslySetInnerHTML` on user content.
- Image remote hosts stay allow-listed (`images.unsplash.com`, `ui-avatars.com`). Never `hostname: "**"`.

---

## 7. Data protection (do this on every PII change)

See [IT_ACT_INDIA.md](./IT_ACT_INDIA.md) for the legal mapping. Product rules:

- 18+ attestation + Terms + Privacy consent stored as `ConsentRecord` at signup.
- Collect only what you use. Do not add phone, DOB, or KYC files without a new privacy notice.
- Profile: email and role are **read-only** in the UI and ignored if sent in PUT.
- Export (`GET /api/user/export`) and erase (`POST /api/user/delete`) must keep working.
- Erasure anonymises email, clears personal fields, drops consents, bumps `tokenVersion`.
- Hash IPs at rest (`hashIp`). Do not store raw IP in audit rows.
- Strip `passwordHash`, `tokenVersion`, `lastLoginIpHash`, lock internals from API JSON.
- No advertising cookies. Cookie notice stays honest (`/cookies`).
- No camera / face tracking.
- Public copy must match the product. **Never claim** PCI-DSS, 99.99% uptime, completed pen tests, `.edu` auto-verify, SMS, or wallet passes.

---

## 8. Headers (must stay in `next.config.mjs`)

| Header | Value |
| :--- | :--- |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Content-Security-Policy` | default `self`; no `object-src`; `frame-ancestors 'none'` |
| `X-Powered-By` | off |

DB TLS: `rejectUnauthorized` stays **true** unless a local-only override is set.

---

## 9. Errors and logging

- Client sees a short `error.code` + `error.message`. No stack, no Prisma, no file paths, no SQL.
- DB unreachable → **503** `DEPENDENCY_UNAVAILABLE`.
- Server logs: error code only, not the full query with user input.
- NextAuth `authorize` catches DB failures and still throws `INVALID_CREDENTIALS`.

---

## 10. API matrix (test every one)

Unauthenticated callers must receive **401** (or **403** CSRF) on:

- `POST /api/events`
- `POST /api/opportunities`
- `POST /api/registrations` (ignore body `userId`)
- `POST /api/host/apply` (ignore body `userId`)
- `POST /api/opportunities/:id/apply`
- `GET/PUT /api/user/profile`
- `GET /api/user/export`
- `POST /api/user/delete`
- `GET /api/registrations`
- `GET /api/host/apply`
- All `/api/v2/admin/*`

Public (still rate-limited):

- `GET /api/events`, `GET /api/events/:id`
- `GET /api/opportunities`
- `POST /api/contact` (Origin required)
- `POST /api/auth/register`, NextAuth, forgot/reset

Student must **not**: create events, create opportunities, read admin APIs, or set `role: SUPER_ADMIN`.

---

## 11. Pre-ship gate

Check every box before merge or deploy:

- [ ] `npm test` green
- [ ] `npm run test:security` green against a seeded DB
- [ ] `npx next build` green
- [ ] New routes: auth, CSRF, rate limit, allow-listed fields
- [ ] No new secret in git
- [ ] No new PII field without privacy/terms update
- [ ] No new marketing claim that the code does not do
- [ ] Admin / host / student roles re-tested if authz changed
- [ ] `NEXTAUTH_SECRET` and `TICKET_HMAC_SECRET` set in the target environment

If any box is unchecked, **do not ship**.
