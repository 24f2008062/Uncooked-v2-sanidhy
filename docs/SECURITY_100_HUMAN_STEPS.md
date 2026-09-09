# Reach “security production-ready” — human steps only you can do

Code cannot finish these. Until they are done, **we are not 100%**.

## 1) Supabase Auth (blocker for login)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → project **`dixvabzhelffozvcpyfg`**
2. **Settings → API**
3. Copy:
   - Project URL → must be `https://dixvabzhelffozvcpyfg.supabase.co`
   - `anon` `public` key → **full** string (3 JWT parts, usually 200+ chars)
   - `service_role` key → **full** string (never commit / never paste in chat)
4. **Authentication → Providers → Email**: decide confirm-email on/off until SMTP works
5. **Authentication → URL configuration**: Site URL = your public HTTPS origin (`https://uncooked-v2.vercel.app` or later `https://opportia.in`)

## 2) Vercel env + redeploy

In Vercel project → **Settings → Environment Variables** (Production):

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://dixvabzhelffozvcpyfg.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | full anon JWT |
| `SUPABASE_SERVICE_ROLE_KEY` | full service_role JWT |
| `NEXT_PUBLIC_APP_URL` | `https://uncooked-v2.vercel.app` (then switch to `https://opportia.in`) |
| `NEXTAUTH_URL` | same as `NEXT_PUBLIC_APP_URL` |
| `NEXTAUTH_SECRET` | ≥32 random chars |
| `TICKET_HMAC_SECRET` | ≥32 random chars, **different** from NEXTAUTH_SECRET |
| `UPSTASH_REDIS_REST_URL` / `TOKEN` | already expected for prod health |
| `RESEND_API_KEY` or SMTP_* | required — health will 503 without email in prod |
| `EMAIL_FROM` | e.g. `Opportia <support@opportia.in>` |

Then **Redeploy** (include latest local security/perf commits when pushed).

CLI option after `vercel login`:

```bash
vercel env pull .env.local
# or set vars in dashboard, then:
vercel --prod
```

## 3) Email

- Create Resend (or SMTP) API key
- Verify sending domain / from-address
- Send test: signup verification + password reset + contact

## 4) Cloudflare WAF + domain

1. Add `opportia.in` to Cloudflare (proxy orange-cloud)
2. Point to Vercel per Cloudflare+Vercel docs
3. Enable WAF managed rules + Bot Fight / Super Bot Fight
4. Set Vercel/custom domain + update `NEXT_PUBLIC_APP_URL` / `NEXTAUTH_URL`
5. Confirm HTTP→HTTPS and HSTS on the custom host

## 5) Smoke + authenticated security

After Auth works, create disposable users:

- USER / ORGANIZER / SUPER_ADMIN

Run:

- signup → verify → login → dashboard
- register for event / ticket QR
- host apply / check-in
- admin lock/role (staging preferred)
- export + erase (careful)

Then close go-live issues #57–#62 and pen-test #72.

## Definition of “security-ready” (practical 100%)

- [ ] `/api/health` returns **200** with `auth: ok`, email configured
- [ ] Real login succeeds; cookies set; dashboard loads
- [ ] Register + password reset email received
- [ ] Anon attack suite still green (CSRF/RL/authz)
- [ ] Short authenticated IDOR/ticket check done
- [ ] Cloudflare in front (or accepted residual risk documented)
- [ ] Custom domain HTTPS live **or** vercel.app accepted as temporary prod host
