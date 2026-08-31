# India IT & data-protection law — Uncooked

**Document type:** Internal product mapping (not a government certificate)  
**Product:** Uncooked campus events platform  
**Country of operation:** India  
**Date:** 27 August 2026  
**Privacy / Terms version in product:** `2026-08-27`  
**Security rules to follow on every change:** [SECURITY_TEST.md](./SECURITY_TEST.md)

No Indian ministry, MeitY, the Data Protection Board, or CERT-In issues a badge that a website is “following an Act perfectly.” Compliance is shown by **what the product actually does**. This file lists only laws whose requirements are implemented in this codebase today.

---

## 1. Digital Personal Data Protection Act, 2023 (DPDP Act)

**Status in product: implemented for a campus web app that is a Data Fiduciary.**

| Obligation in the Act | What Uncooked does in code |
| :--- | :--- |
| Identify a Data Fiduciary | Privacy Policy states Uncooked is the Data Fiduciary for personal data collected on this site. |
| Notice before / at collection | `/privacy` explains what is collected, why, retention, sharing, and rights. Signup requires reading Terms + Privacy. |
| Consent — free, specific, informed, unambiguous | Signup cannot complete without `acceptTerms` and stored `ConsentRecord` rows (`TERMS`, `PRIVACY`, `AGE_18`) with version and hashed IP. |
| Purpose limitation | We collect name, email, optional campus/department, event registrations, host-application notes, opportunity applications, and support messages. Phone is not collected. We do not run advertising cookies or sell personal data. |
| Children’s data (under 18) | Service is 18+ only. `ageAttested18` is required at registration. Accounts believed to belong to a child can be erased via the grievance email. |
| Right of access and correction | Signed-in user can view and update profile (`GET`/`PUT /api/user/profile`). |
| Right to data portability / copy | `GET /api/user/export` downloads the user’s personal data as JSON from the dashboard. |
| Right to erasure | `POST /api/user/delete` anonymises the account, clears personal fields, deletes consents, increments `tokenVersion` (sessions die). |
| Withdrawal of consent | Account erasure is the withdrawal path. |
| Security safeguards | scrypt password hashes, 12-character policy, lockout, 7-day HTTP-only sessions, token revocation, CSRF origin checks, rate limits, RBAC, HMAC-signed tickets, security headers (HSTS, CSP, frame denial, nosniff). |
| Grievance redressal | Grievance Officer name + email published on `/privacy` (`GRIEVANCE_OFFICER_NAME`, `GRIEVANCE_EMAIL`). |
| No tracking for ads | Cookie notice: necessary cookies only. No third-party ad pixels. |
| No biometric processing without consent | Homepage camera / face-api tracking is disabled. We do not store face data. |

Public pages: `/privacy`, `/terms`, `/cookies`, `/dashboard` (export + erase).

---

## 2. Information Technology Act, 2000 — Section 43A

**Status in product: implemented (reasonable security practices for sensitive personal data we hold).**

Section 43A requires a body corporate that possesses, deals, or handles sensitive personal data to implement **reasonable security practices** and procedures.

| Practice | Implementation |
| :--- | :--- |
| Passwords are sensitive personal data | Stored only as scrypt hashes. Plaintext comparison is rejected. |
| Access control | Mutating APIs require a valid session. Admin APIs require `SUPER_ADMIN`. Client-supplied `userId` is ignored. |
| Session security | HTTP-only cookies; Secure + `__Secure-` / `__Host-` names in production; 7-day max age; revocation on lock, role change, password reset, and erasure. |
| Abuse resistance | Per-IP rate limits on register, login-related, contact, and writes. Account lock after 8 failed logins. Platform write kill-switch persisted in the database. |
| Least privilege | Console cannot grant `SUPER_ADMIN`. Organiser vs student roles are enforced on the server. |
| Transport | TLS at the host; HSTS; TLS to Postgres when the provider requires it (`rejectUnauthorized` stays on unless explicitly overridden for local only). |
| Audit | Administrative actions (role, lock, host review, kill-switch, export, erase) are written to `AuditLog`. |
| No card data on our servers | Payments are not live. We do not store PAN/CVV. Security page states we are **not** PCI-DSS certified. |

---

## 3. Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 (SPDI Rules)

**Status in product: implemented for the data we actually collect.**

| Rule | Implementation |
| :--- | :--- |
| Publish a privacy policy | `/privacy` — collection, purpose, disclosure, security, rights, grievance officer. |
| Collect only for a lawful purpose | Account, events, host review, jobs, support. Documented on `/privacy`. |
| Consent for collection | Checkbox + `ConsentRecord` at signup. |
| Do not publish / sell SPDI | We do not sell personal data. Hosts see attendee name only as needed for a guest list. |
| Allow review / correction / withdrawal | Profile edit, data export, account erasure. |
| Transfer only with comparable protection | No ad networks. Processors are hosting/database under our instruction. Card processors are not connected. |
| Grievance officer with contact | Published on `/privacy`. |

Sensitive personal data we handle today: **passwords** (hashed). We do **not** collect financial account numbers, biometric templates, medical records, or Aadhaar numbers.

---

## 4. Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021

**Status in product: implemented for a non-significant intermediary hosting user listings (events, host applications, job posts, contact messages).**

| Due-diligence item | Implementation |
| :--- | :--- |
| User agreement / terms | `/terms` — eligibility (18+), acceptable use, host responsibility, no probing of access controls. |
| Privacy policy | `/privacy`. |
| Grievance officer publicly displayed | Name and email on `/privacy`. |
| Ability to act on unlawful / unsafe listings | Super Admin can lock accounts, change organiser status, and pause platform writes (kill-switch). Hosts cannot publish until verified. |
| No fake “we are fully PCI / 99.99% / pen-tested” claims | `/security`, `/about`, `/help`, `/host` copy matches the product. |

We are **not** claiming Significant Social Media Intermediary status (that threshold is 5 million registered users in India). Extra monthly compliance reports for SSMIs are therefore not applicable.

---

## 5. Consumer Protection Act, 2019 — misleading advertisements / unfair statements

**Status in product: implemented by making public claims match the software.**

| We do not claim | Why |
| :--- | :--- |
| “Fully PCI-DSS compliant” | Payments are not live; we have no PCI assessment. |
| 99.99% uptime SLA | Not measured, not contracted. |
| Completed third-party penetration tests | Not performed. |
| `.edu` auto-verification | Not built. |
| Native scanner app / SMS / Apple-Google Wallet | Not built. |
| “Delete anytime” with no API | Erasure **is** built (`/api/user/delete` + dashboard). |

Honest security page: `/security`.

---

## 6. Aadhaar (Targeted Delivery of Financial and Other Subsidies, Benefits and Services) Act, 2016

**Status in product: followed by non-collection.**

We do not ask for, store, or display Aadhaar numbers or Aadhaar copies. Host apply accepts organisation name, type, and notes only — no identity-document upload.

---

## 7. Laws we deliberately do **not** claim

These are **not** “followed perfectly” because they either do not apply yet or need an organisation step outside the repo:

| Law / regime | Why we do not claim it |
| :--- | :--- |
| PCI-DSS | No card processing on Uncooked servers. |
| RBI PA/PG guidelines | No live payment aggregation. |
| ISO/IEC 27001 certification | We implement security controls; we do not hold an ISO certificate. |
| CERT-In 6-hour incident reporting as a certified process | We have an audit log and a public report address; a full CERT-In runbook + 6-hour clock is an operations process, not a product feature. |
| DPDP “Significant Data Fiduciary” extra duties (DPO, Data Protection Impact Assessment, independent audit) | Only if the Central Government designates us. Not designated. |
| GDPR / UK GDPR | We operate for India. We do not market those regimes on the site. |

---

## 8. Operator checklist (required for the legal pages to stay true)

The code is aligned with the Acts above **only if** the company also does this:

1. Set a real legal entity name: `LEGAL_ENTITY_NAME`.
2. Appoint a **named** Grievance Officer and a mailbox that is read: `GRIEVANCE_OFFICER_NAME`, `GRIEVANCE_EMAIL`.
3. Keep `NEXTAUTH_SECRET` and `TICKET_HMAC_SECRET` set to long random values (never the old hardcoded fallback).
4. Run production on HTTPS with the generated security headers.
5. Point `DATABASE_URL` at a real Postgres instance and apply the Prisma schema.
6. Do not take card payments until a licensed Indian payment partner is wired and this file is updated.

---

## 9. Short answer

**Acts this product is built to follow, with matching implementation in the repo:**

1. **Digital Personal Data Protection Act, 2023**
2. **Information Technology Act, 2000 — Section 43A**
3. **SPDI Rules, 2011**
4. **IT Intermediary Guidelines Rules, 2021** (ordinary intermediary)
5. **Consumer Protection Act, 2019** (truthful public claims)
6. **Aadhaar Act, 2016** (by not collecting Aadhaar)

That is the complete honest list. Do not add PCI-DSS, ISO 27001, or “fully government certified” to marketing copy. Those are not in this product.
