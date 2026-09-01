# Production readiness pack

**Branch:** `feat/production-readiness-pack`  
**Do not merge until staging secrets are filled and CI is green.**

## What this pack ships

| Area | Deliverable |
| --- | --- |
| Env contract | [ENV.md](./ENV.md) + updated `.env.example` |
| CI | `.github/workflows/ci.yml` (unit tests + build + advisory lint) |
| Shared rate limits | Upstash Redis REST when configured; memory fallback otherwise |
| Observability | Optional Sentry capture via `SENTRY_DSN` |
| DB pool | Smaller serverless pool (`DATABASE_POOL_MAX`, default 3 in prod) |
| Health | `GET /api/health` |
| Trust catalog | `VERIFIED_HOSTS_ONLY=true` filters public events |
| Door scanner | `/host/scanner/[eventId]` + `POST /api/events/[id]/check-in` |
| CSRF local | Allows localhost ports 3000/3001/3010 in development |

## Before merge (you provide)

1. Fill Vercel env from [ENV.md](./ENV.md) (secrets, Redis, Sentry, real emails)  
2. Confirm Postgres pooler URL  
3. Seed one `SUPER_ADMIN`  
4. Soft-launch checklist: register → host apply → approve → create → RSVP → scanner check-in  

## Verify locally

```bash
npm test
npm run build   # needs generateable Prisma client; dummy DATABASE_URL ok for compile
```
