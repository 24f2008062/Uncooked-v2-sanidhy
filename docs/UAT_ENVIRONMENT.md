# Opportia — UAT / Staging Environment Design

**Document ID:** `OPP-UAT-2026-09`  
**Audience:** Engineering, product owner, pilot hosts  
**Status:** Proposed design — not implemented  
**Owner:** Engineering lead  
**Last updated:** 18 September 2026

---

## 1. Purpose

UAT (User Acceptance Testing) is a safe, production-like copy of Opportia used to test a real release before it reaches real campuses.

It answers one question: **can a student, host, and admin complete their important journeys safely on the exact version we intend to release?**

UAT does **not** prove that Opportia can handle 100,000 users. Performance and load testing are separate activities.

---

## 2. Non-negotiable safety rules

1. UAT must never read from or write to production databases, Redis, storage, email lists, or secrets.
2. UAT and production must use different Supabase projects, databases, Redis databases, service-role keys, signing keys, and payment keys.
3. A UAT QR pass, session, reset link, or API credential must never work in production, and the reverse must also be true.
4. No production personal data may be copied into UAT. Use seeded test data only. Any exception requires written approval and prior anonymisation.
5. UAT payment flows must use gateway **test mode only**. No real charge, payout, refund, webhook, or invoice may be created from UAT.
6. Production environment variables are never copied wholesale into UAT. Every UAT variable is created and reviewed separately.
7. A failed test in authentication, permissions, ticket generation, QR check-in, payment, or data integrity blocks production release until fixed and retested.

---

## 3. Environment model

| Environment | Purpose | Who uses it | Data and secrets |
| --- | --- | --- | --- |
| Local | Developer work | Engineers | Local or disposable test data |
| Preview | PR review | Engineers | Isolated test configuration only; never production |
| **UAT / Staging** | Formal release testing | Product, engineers, selected pilots | Dedicated UAT services and seeded data |
| Production | Live product | Real users | Production-only services and data |

### Required UAT endpoint

Use one stable HTTPS URL, for example `https://uat.opportia.in`. Do not use a temporary per-PR URL for formal UAT: OAuth callback settings and tester instructions need one fixed address.

---

## 4. Required service isolation

| Component | UAT requirement |
| --- | --- |
| Application | A stable Vercel UAT deployment with UAT-only environment variables |
| Authentication | Separate Supabase project: `opportia-uat` |
| Database | Separate UAT Postgres database with the same Prisma migrations as production |
| Redis | Separate Upstash database: `opportia-uat` |
| Email | Controlled QA inboxes only; no production audience, broadcast, or mailing list |
| Payments | Razorpay/Stripe sandbox or disabled; test keys only |
| Error monitoring | Separate project or the mandatory tag `environment=uat` |
| File storage | Separate UAT bucket/project; never production storage |

### Authentication standard

Opportia uses **Supabase Auth**. Do not configure `NEXTAUTH_URL` or `NEXTAUTH_SECRET` unless the codebase still actively requires NextAuth and the engineering lead documents why.

For UAT, configure the exact UAT origin in Supabase Auth:

- Site URL: `https://uat.opportia.in`
- Redirect URL: `https://uat.opportia.in/auth/callback`

If Google OAuth is enabled, the same callback URL must also be added to the UAT Google OAuth client. Prefer a separate OAuth client for UAT.

---

## 5. Deployment and release control

### Branches

- `main`: reviewed, releasable code.
- `staging`: UAT deployment branch, protected from direct pushes.
- Feature branches: merged through PRs only.

### Required release process

1. A PR passes CI: lint, type-check, build, unit tests, and relevant security tests.
2. Merge the approved change into `main`.
3. Select one exact Git commit SHA from `main` and deploy that commit to UAT.
4. Record that commit SHA in the UAT sign-off record.
5. Run the UAT checklist against that deployment only.
6. After all required sign-offs pass, deploy the **same recorded commit SHA** to production.
7. Do not merge extra commits, rebuild from a moving branch, or manually edit production during this promotion.

If any code, environment variable, migration, dependency, or configuration changes after sign-off, UAT sign-off is invalid and must be repeated.

---

## 6. Database, migration, backup, and reset policy

### Migrations

- Apply exactly the same Prisma migration history to UAT before every formal UAT cycle.
- Test destructive migrations on UAT first.
- A production migration requires a documented rollback or recovery plan before release.

### Backup and recovery

- Enable UAT database backups before the first formal cycle.
- Before the first production launch and after any risky migration, perform a UAT restore drill: restore a backup into a safe UAT database and verify the app can read it.
- Record the date, owner, result, and issues found.

### Reset policy

- Reset UAT only before a scheduled UAT cycle or after explicit approval from the engineering lead.
- Announce the reset in the team channel at least 24 hours in advance when external testers are involved.
- Reset means: retain schema, delete UAT test data, re-run the approved seed script, and verify health checks.
- Never reset production.

---

## 7. UAT test data and access

Use only controlled test accounts. Passwords and recovery details belong in the shared team password vault, never GitHub, chat, screenshots, or documentation.

| Role | Minimum count | Purpose |
| --- | ---: | --- |
| Super admin | 1 | Admin permissions, moderation, operational controls |
| Approved host | 1–2 | Event creation, scanner, host controls |
| Student | 3–5 | Registration, QR passes, duplicate check-in tests |
| Support/test operator | Optional | Safe support and broadcast checks |

Seed at least:

- two upcoming events and one past event;
- one event registration with a valid QR pass;
- one active opportunity/application flow, if applicable;
- only fake names, phone numbers, and `@example.com` or controlled QA email addresses.

UAT access must be limited to named team members and invited testers. If external testers need access, use an allowlist or controlled invitation process; do not expose admin or service credentials.

---

## 8. Environment variable policy

All variables are configured in the UAT deployment scope only and reviewed by two people before the first release.

| Variable group | UAT requirement |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Exact UAT HTTPS origin |
| Supabase URL / anon key / service-role key | Values from the UAT Supabase project only |
| `DATABASE_URL`, `DIRECT_URL` | UAT database only |
| Upstash Redis variables | UAT Redis only |
| Ticket-signing secret | Newly generated UAT-only secret, different from every other environment |
| Email provider variables | QA-safe sender and recipient policy |
| Payment keys | Test/sandbox keys only |
| Sentry DSN | UAT project or mandatory UAT environment tag |
| Google OAuth credentials | UAT client credentials where available |

Never commit secret values. Never place a Supabase service-role key in browser-exposed variables. Any suspected secret exposure requires immediate rotation of the affected key and a documented incident review.

---

## 9. Required acceptance checklist

Run the checklist only on the stable UAT URL and record the tested commit SHA.

### Access and authentication

- [ ] Email/password login works.
- [ ] Password reset email reaches only the QA inbox and completes safely.
- [ ] Google OAuth works, if enabled.
- [ ] Logged-out users cannot access protected dashboard, settings, host, or admin routes.
- [ ] Bad login attempts are rate-limited and return safe errors.

### Student journey

- [ ] Browse and filter events.
- [ ] Open an event and register successfully.
- [ ] QR pass is created and appears in the dashboard.
- [ ] QR pass works on a real mobile device.

### Host journey

- [ ] Approved host can create or manage an event as intended.
- [ ] Scanner can request camera access and scan a valid UAT QR pass.
- [ ] Duplicate scan shows an already-checked-in result without creating a duplicate entry.
- [ ] Manual/paste fallback works if camera permission is denied.
- [ ] Non-host users are blocked from host pages and APIs.

### Admin, payments, and safety

- [ ] Only admins can access admin pages and APIs.
- [ ] Support and communication functions are restricted to safe UAT recipients.
- [ ] Paid-event flow is either disabled or visibly uses payment test mode.
- [ ] UAT health check confirms database, auth, Redis, and email status as applicable.
- [ ] One low-end Android and one current Android/iOS device complete the key QR flow.

### Release decision

Any failure in auth, authorisation, payment safety, ticket issuance, check-in, migration, or data integrity is a release blocker.

| Role | Named owner | Date | Commit SHA | PASS / FAIL |
| --- | --- | --- | --- | --- |
| Engineering lead |  |  |  |  |
| Product owner |  |  |  |  |
| Pilot host (optional) |  |  |  |  |

---

## 10. Performance is a separate gate

Before a large campus event, run a separate load test on a dedicated non-production environment. At minimum test:

- event listing and filtering;
- simultaneous registration;
- QR pass retrieval;
- check-in API and duplicate-scan handling;
- Redis rate limits and database connection limits.

Define expected traffic, success rate, latency limits, and rollback conditions before the test. Do not run destructive load tests against production.

---

## 11. Ownership and first implementation plan

| Step | Responsible person | Required evidence |
| --- | --- | --- |
| Create UAT Supabase and database | Engineering lead | Project ID, migrations applied |
| Create UAT Redis and storage | Engineering lead | Isolated service configuration verified |
| Configure UAT deployment and domain | Engineering lead | Stable URL and variable review record |
| Configure OAuth and safe email | Engineering lead | Login and reset test results |
| Add reset/seed script | Full-stack engineer | Reviewed script and seed run result |
| Perform restore drill | Engineering lead | Restore record |
| Run formal UAT | Product owner + named testers | Completed checklist and commit SHA |
| Release approved commit | Engineering lead | Production deployment matches signed SHA |

---

## 12. Definition of UAT readiness

UAT is ready only when all of the following are true:

1. The stable UAT URL is live and points only to UAT services.
2. UAT database, Redis, storage, auth, email, payment, and signing secrets are isolated from production.
3. The approved seed and reset process works.
4. The required acceptance checklist has passed for a recorded commit SHA.
5. A backup restore drill has been completed successfully.
6. The engineering lead and product owner have explicitly approved the release.

---

## 13. What this does not cover

- Production WAF and Cloudflare hardening;
- 100,000-user capacity or load testing;
- production incident response;
- copying production data into test environments;
- using UAT as a shortcut to bypass release review.

*Internal document. This is a proposed design and must not be treated as implemented until the evidence listed above exists.*
