# 🗺️ Uncooked Portal — Prioritized Implementation Plan

This document outlines the step-by-step development plan for completing the backend infrastructure and full-stack features of the **Uncooked Portal**, categorized by priority and execution phase.

---

## 🎯 Priority Matrix Overview

```
 ┌────────────────────────────────────────────────────────┐
 │ Phase 0: Complete Auth, RBAC Middleware & Security    │  🔐 IMMEDIATE / FOUNDATION
 ├────────────────────────────────────────────────────────┤
 │ Phase 1: Core Ticketing, QR Scanner & Payment Engine   │  🔥 CRITICAL
 ├────────────────────────────────────────────────────────┤
 │ Phase 2: Host KYC Governance & Opportunities Portal    │  ⚡ HIGH
 ├────────────────────────────────────────────────────────┤
 │ Phase 3: Super Admin Console & Telemetry Infrastructure │  🛡️ MEDIUM-HIGH
 ├────────────────────────────────────────────────────────┤
 │ Phase 4: Real-Time Chat, Bulletins & Recommendation AI │  💬 MEDIUM
 └────────────────────────────────────────────────────────┘
```

---

## 🔐 Phase 0: Complete Auth, RBAC Middleware & Security Hardening (Foundation)
*Status: Core NextAuth + scrypt hashing implemented; API route protection and recovery flows needed.*

### 0.1 Role-Based Access Control (RBAC) Route Middleware
- [ ] **Middleware**: `middleware.js` (Next.js App Router Middleware)
  - Protects `/admin/*` routes (Requires `session.user.role === "SUPER_ADMIN"`).
  - Protects organizer routes (Requires `session.user.role === "ORGANIZER"` or `"SUPER_ADMIN"`).
  - Protects `/dashboard`, `/registrations`, and application endpoints (Requires authenticated session).
  - Automatically redirects unauthorized visitors to `/login?callbackUrl=...`.

### 0.2 Password Reset & Email Verification Flow
- [ ] **Endpoint**: `POST /api/auth/forgot-password` & `POST /api/auth/reset-password`
  - Generates secure random verification tokens, stores expiration timestamp.
  - Sends password reset links via Resend / Nodemailer.
- [ ] **Endpoint**: `GET /api/auth/verify-email`
  - Validates email verification tokens and updates `User.emailVerified: new Date()`.

### 0.3 Profile Onboarding Flow
- [ ] **Endpoint**: `POST /api/user/onboarding`
  - Saves student department, club association, interests array, and portfolio links.
  - Sets `User.onboardingCompleted: true`.
- [ ] **UI Component**: `/onboarding` multi-step setup page for first-time signups.

### 0.4 Google OAuth Production Configuration
- [ ] **Provider Configuration**: Update `src/lib/auth.js` to enable `GoogleProvider` when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are configured in `.env.local`.

---

## 🚀 Phase 1: Core Transactional & Ticketing Infrastructure (Critical)
*Objective: Enable live event booking, instant QR ticket scanning, and payment collection.*

### 1.1 Digital QR Ticket Check-In Scanner Engine
- [ ] **Endpoint**: `POST /api/registrations/[id]/checkin`
  - Validates pass signature (`sig`), checks if user is already checked in.
  - Updates `checkInStatus: true` and logs check-in timestamp.
  - Prevents ticket duplication and double-scanning at venue gates.
- [ ] **UI Component**: Organizer QR Code Camera Scanner component / manual ticket ID lookup modal.

### 1.2 Payment Gateway Integration (Razorpay & Stripe)
- [ ] **Endpoint**: `POST /api/payments/create-order`
  - Calculates total price for paid ticket tiers or applied promo coupons.
  - Generates Razorpay Order ID / Stripe Checkout Session.
- [ ] **Endpoint**: `POST /api/payments/verify` & `POST /api/payments/webhook`
  - Verifies HMAC SHA-256 signature from Razorpay / Stripe webhooks.
  - Automatically updates `Registration.status` from `Pending` to `Confirmed`.

### 1.3 Multi-Tiered Ticketing & Coupon Validation
- [ ] **Endpoint**: `POST /api/coupons/validate`
  - Validates discount codes (`code`), checks expiry date (`expiresAt`) and maximum use limits (`maxUses`).
- [ ] **Event Ticket Modal Enhancement**: Connect tier selection dropdown (`TicketTier`) to calculate exact checkout total dynamically.

---

## ⚡ Phase 2: Host KYC Verification & Career Portal (High Priority)
*Objective: Empower organizers with verified status and give students an application workflow for jobs/internships.*

### 2.1 Host Application & KYC Review Dashboard
- [ ] **Endpoint**: `GET /api/admin/hosts` & `PUT /api/admin/hosts/[id]`
  - Lists pending organizer applications (`PENDING`).
  - Supports status updates (`APPROVED`, `REJECTED`, `INFO_REQUESTED`) and internal admin reviewer notes.
- [ ] **UI Page**: `/admin/hosts` dashboard with document attachment viewer modal.

### 2.2 Opportunities Application & Resume Portal
- [ ] **Endpoint**: `POST /api/opportunities/[id]/apply`
  - Accepts student submissions containing `resumeUrl`, `coverNote`, and pitch details.
- [ ] **Endpoint**: `GET /api/opportunities/my-applications`
  - Allows applicants to track application status progression: `PENDING` → `REVIEWING` → `SHORTLISTED` → `ACCEPTED`.
- [ ] **UI Component**: "Apply Now" modal on `/opportunities` page and student application tracking tab in `/dashboard`.

---

## 🛡️ Phase 3: Super Admin & System Governance Console (Medium-High)
*Objective: Provide platform governance, system health telemetry, and support desk tools.*

### 3.1 Super Admin User Management (`/admin/users`)
- [ ] **Endpoint**: `GET /api/admin/users` & `PATCH /api/admin/users/[id]`
  - Enables Super Admins to promote/demote user roles (`USER`, `ORGANIZER`, `SUPER_ADMIN`).
  - Supports batch account locking/unlocking and permission editing.

### 3.2 System Telemetry & Emergency Incident Controls (`/admin/telemetry`)
- [ ] **Endpoint**: `GET /api/admin/telemetry` & `POST /api/admin/telemetry/snapshot`
  - Captures CPU, memory usage, API latency, and database query latency.
- [ ] **System Kill-Switch**: Emergency feature flag toggles to pause registrations during high-load traffic surges.

### 3.3 Categorized Support Desk System
- [ ] **Endpoint**: `POST /api/tickets` & `POST /api/tickets/[id]/messages`
  - Allows users to open support tickets (Ticketing, Host KYC, Technical, Billing).
  - Enables internal staff messaging via `TicketMessage` model.

---

## 💬 Phase 4: Community, Realtime & Engagement (Medium Priority)
*Objective: Build interactive community features and smart event recommendations.*

### 4.1 Live Event Bulletins & Announcement Broadcasts
- [ ] **Endpoint**: `GET /api/events/[id]/bulletins` & `POST /api/events/[id]/bulletins`
  - Organizers post real-time updates (e.g. "Hackathon Judging starts in 30 mins").
  - Attendees view live feed on the event details page.

### 4.2 Real-Time Event Chat via WebSockets (Pusher)
- [ ] **Schema Update**: Define `ChatMessage` model in Prisma.
- [ ] **WebSocket Integration**: Connect Pusher client-side channels for real-time live event discussion rooms.

### 4.3 Algorithmic Recommendation Engine & Event Reviews
- [ ] **Service**: `src/server/services/recommendationService.js`
  - Scores events based on user interests, past registrations, and interaction logs (`UserActivity`).
- [ ] **Event Reviews**: User rating (1-5 stars) and feedback submission module.

---

## 📅 Execution Roadmap Summary

| Week / Milestone | Deliverables | Key Output |
| :--- | :--- | :--- |
| **Milestone 0** | Phase 0 (RBAC Middleware `middleware.js`, Password Reset Flow, Onboarding API) | Full security guards & account recovery |
| **Milestone 1** | Phase 1 (QR Check-In Scanner, Razorpay/Stripe Payment Order APIs, Coupon Engine) | End-to-end ticketing & check-in flow live |
| **Milestone 2** | Phase 2 (Host KYC Review Dashboard, Opportunity Application Submission API) | Verified host ecosystem & student job applications |
| **Milestone 3** | Phase 3 (Super Admin User Governance, System Telemetry, Support Desk APIs) | Full platform administration console |
| **Milestone 4** | Phase 4 (Pusher Realtime Chat, Bulletin Feed, Recommendation Engine) | Live community engagement features |
