# Uncooked environment variables

**Audience:** engineering + deploy  
**Updated:** 2 September 2026  
**Related:** [SECURITY.md](../SECURITY.md), [SECURITY_TEST.md](./SECURITY_TEST.md)

Copy [`.env.example`](../.env.example) to `.env.local` for local work. Set the same keys in Vercel (Production + Preview). **Never commit real values.**

Provide secrets later via your secret manager / Vercel dashboard. This file is the contract.

---

## 1. Required (app will not boot safely without these)

| Variable | Example / shape | Used for |
| --- | --- | --- |
| `NEXTAUTH_URL` | `https://app.uncooked.dev` | Canonical site URL, CSRF Origin allowlist, NextAuth |
| `NEXT_PUBLIC_APP_URL` | same as above | Client + CSRF allowlist (must match browser origin) |
| `NEXTAUTH_SECRET` | 64+ random hex/base64 | JWT signing. Min 32 chars. Ban: `dev_secret`, `change-me`, `fallback` |
| `TICKET_HMAC_SECRET` | 64+ random, **≠** `NEXTAUTH_SECRET` | QR / pass HMAC |
| `DATABASE_URL` | Postgres URL (prefer **pooler** in prod) | Prisma runtime |
| `DIRECT_URL` | Postgres direct URL | Migrations / `prisma db push` |

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## 2. Strongly recommended for production

| Variable | Example | Used for |
| --- | --- | --- |
| `UPSTASH_REDIS_REST_URL` | `https://xxxx.upstash.io` | Shared rate limits across serverless isolates |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash token | Auth for Redis REST |
| `SENTRY_DSN` | `https://...@sentry.io/...` | Server error reporting |
| `NEXT_PUBLIC_SENTRY_DSN` | same or browser DSN | Client error reporting (optional) |
| `SENTRY_ENVIRONMENT` | `production` / `preview` | Sentry env tag |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | `true` (default) | TLS to Postgres. Set `false` only if your provider requires it |

Without Redis, rate limits fall back to **in-memory** (per instance). Fine for local; **not** enough for multi-instance prod peak.

Without Sentry, errors still go to server logs only.

---

## 3. Product / legal (defaults exist, override in prod)

| Variable | Default-ish | Used for |
| --- | --- | --- |
| `LEGAL_ENTITY_NAME` | `Uncooked` | Privacy / terms copy |
| `GRIEVANCE_OFFICER_NAME` | `Grievance Officer` | DPDP grievance |
| `GRIEVANCE_EMAIL` | `support@uncooked.in` | Must be a real monitored inbox in prod |
| `SUPPORT_EMAIL` | `support@uncooked.in` | Contact / support |

---

## 4. Optional integrations (off until configured)

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` | `true` only with real Google OAuth credentials |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `RESEND_API_KEY` | Transactional email (password reset in prod) |
| `EMAIL_FROM` | e.g. `Uncooked <noreply@yourdomain>` |
| `VERIFIED_HOSTS_ONLY` | `true` = public event list only shows events from ORGANIZER/SUPER_ADMIN creators |
| `APP_URL` | Alias accepted by CSRF allowlist if set |

---

## 5. Local development

```bash
cp .env.example .env.local
# fill NEXTAUTH_SECRET + TICKET_HMAC_SECRET (different)
# start Postgres on DATABASE_URL
npx prisma db push
npx prisma db seed
npm run dev
```

CSRF allowlist in development includes `http://localhost:3000` and `http://127.0.0.1:3000`. Run the app on **port 3000** or set `NEXTAUTH_URL` to your exact origin (scheme + host + port).

---

## 6. Vercel / production checklist

1. Set all **Required** vars on Production and Preview  
2. `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` = the HTTPS domain users type (no trailing slash preferred)  
3. Use Supabase/Neon **pooler** URL in `DATABASE_URL`, direct in `DIRECT_URL`  
4. Add Upstash Redis REST credentials  
5. Add Sentry DSN  
6. Set real grievance/support emails  
7. `VERIFIED_HOSTS_ONLY=true` when you want the trust catalog gate  
8. Deploy → hit `/api/events` → register → create (as ORGANIZER) → scanner check-in  

---

## 7. APIs that depend on env

| Area | Env |
| --- | --- |
| Auth / sessions | `NEXTAUTH_*`, cookies |
| CSRF | `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, `APP_URL` |
| Tickets / scanner | `TICKET_HMAC_SECRET` |
| Rate limits (shared) | `UPSTASH_REDIS_REST_*` |
| DB | `DATABASE_URL`, `DIRECT_URL` |
| Errors | `SENTRY_DSN` |
| Public catalog filter | `VERIFIED_HOSTS_ONLY` |

---

## 8. What we will not put in env

- Superadmin passwords (seed once, rotate via DB)  
- Ticket HMAC material in the client  
- Service role keys in `NEXT_PUBLIC_*`  

If a key must be public, its name starts with `NEXT_PUBLIC_`.
