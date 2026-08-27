# 🛡️ Supabase Authentication & RLS Implementation Strategy (V2 Architecture)

This document provides a technical breakdown and execution roadmap for adopting **Supabase Auth** and **PostgreSQL Row Level Security (RLS)** in the V2 codebase, following the core principles defined in [`docs/SUPABASE_AUTHENTICATION.md`](file:///mnt/8A7C87E87C87CCFF/CODESPACE/Uncooked/Uncooked%20v2/docs/SUPABASE_AUTHENTICATION.md).

---

## 🏛️ Architectural Overview & Core Principles

```
                              USER REQUEST
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │    Supabase Auth (JWT / SSR)   │
                   └───────────────┬───────────────┘
                                   │  auth.uid() + JWT Claims
                                   ▼
                   ┌───────────────────────────────┐
                   │      Next.js Middleware       │
                   │      (Server-Side Guard)       │
                   └───────────────┬───────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │  Centralized Auth Module      │
                   │  (src/server/auth/*)          │
                   └───────────────┬───────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │  Supabase PostgreSQL Database │
                   │  ├── Row Level Security (RLS) │
                   │  ├── auth.uid() Policies      │
                   │  └── Normalized RBAC Tables   │
                   └───────────────────────────────┘
```

### Key V2 Principles:
1. **Greenfield Security Engine**: V2 does NOT reuse legacy NextAuth wrappers, role caches, or ad-hoc route guards.
2. **Supabase Native Integration**: Auth tokens issued by Supabase propagate directly to PostgreSQL via `auth.uid()`, enforcing database-native Row Level Security (RLS).
3. **Data Preservation & Backward Compatibility**: Existing production database rows are preserved while schema extensions (e.g. normalized RBAC tables) are added.

---

## 📋 Step-by-Step Implementation Roadmap

### 📦 Phase 1: Supabase Client Infrastructure & Environment Setup
*Objective: Install official Supabase packages and configure server/client singletons.*

- [ ] **Dependencies**: Install `@supabase/supabase-js` and `@supabase/ssr`.
- [ ] **Environment Configuration**: Add Supabase environment variables to `.env.local`:
  ```env
  NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
  NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"
  SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
  ```
- [ ] **Client Utilities**:
  - `src/lib/supabase/client.js` — Browser client for interactive login/signup components.
  - `src/lib/supabase/server.js` — Server Component / Route Handler client using `@supabase/ssr` with cookie management.
  - `src/lib/supabase/admin.js` — Privileged service role client for administrative operations.

---

### 🔐 Phase 2: Centralized V2 Authorization Engine (`src/server/auth/`)
*Objective: Consolidate all security logic into a single modular directory as specified in V2 Principles.*

- [ ] **Directory Structure**: Create standard authorization directory:
  ```text
  src/server/auth/
  ├── authentication.js    # Session retrieval, token validation, user context
  ├── authorization.js     # High-level permission & role checks
  ├── permissions.js       # Permission constants & role mappings
  ├── policies/            # Resource-level access policies
  │   ├── events.js        # Event read/create/edit rules
  │   ├── registrations.js # Ticket booking & check-in rules
  │   ├── host-applications.js # KYC review rules
  │   └── administration.js    # Super Admin controls
  └── audit.js             # Audit logging helper
  ```
- [ ] **Resource Policies**:
  - Implement declarative policy functions (e.g. `canUserEditEvent(user, event)`, `canUserReviewHostApp(user)`).

---

### 🔄 Phase 3: Password Migration & User Credential Bridge
*Objective: Seamlessly migrate existing database users to Supabase Auth without forcing disruptive password resets.*

- [ ] **Credential Migration Handler**: `/api/auth/migrate-legacy-user`
  - When a user logs in with email + password, verify their password against `User.passwordHash` (via `scrypt` / `bcrypt`).
  - Upon successful verification, automatically create/link their account in Supabase Auth via `supabase.auth.admin.createUser()`.
  - Store the returned `supabase_uid` on `User.id` or a dedicated `User.supabaseUid` mapping column.
- [ ] **Social OAuth Linking**: Enable Google OAuth via Supabase Auth dashboard and handle account linking.

---

### 🛡️ Phase 4: PostgreSQL Row Level Security (RLS) & RBAC Normalization
*Objective: Move authorization from fragile app-level code directly into database policies.*

- [ ] **Database Migration script**: `prisma/migrations/add_rls_and_rbac.sql`
- [ ] **Enable RLS on Core Tables**:
  ```sql
  ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "Registration" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "HostApplication" ENABLE ROW LEVEL SECURITY;
  ```
- [ ] **Policy Rules**:
  - **Public Read for Active Events**:
    ```sql
    CREATE POLICY "Public events are viewable by everyone" 
    ON "Event" FOR SELECT USING (archived = false);
    ```
  - **Registration Ownership Policy**:
    ```sql
    CREATE POLICY "Users can manage their own registrations" 
    ON "Registration" FOR ALL USING (auth.uid()::text = "userId");
    ```
  - **Host Application Ownership Policy**:
    ```sql
    CREATE POLICY "Applicants view own host status" 
    ON "HostApplication" FOR SELECT USING (auth.uid()::text = "userId");
    ```
- [ ] **RBAC Normalization**:
  - Create normalized tables (`Role`, `Permission`, `UserRole`) to replace un-indexed `User.permissions` JSON.

---

## ⚡ Phase 5: Next.js App Router Guards & Middleware

- [ ] **Next.js Middleware Guard**: `middleware.js`
  - Refresh Supabase Auth session cookies on every request.
  - Route protections:
    - `/admin/*` → Verified Supabase JWT with `role === "SUPER_ADMIN"`.
    - `/host/*` → Verified Supabase JWT with `role === "ORGANIZER"` or `"SUPER_ADMIN"`.
    - `/dashboard` → Authenticated Supabase session.
- [ ] **Route Handler Guards**: Update `/api/events`, `/api/registrations`, `/api/opportunities` to extract `supabase.auth.getUser()` and pass down to policy functions.

---

## 📅 Execution Phases & Priority

| Milestone | Target Scope | Output |
| :--- | :--- | :--- |
| **Phase 1** | Supabase SDK installation & `.env.local` config | Multi-environment Supabase client singletons |
| **Phase 2** | Centralized `src/server/auth/` architecture | Clean, reusable policy engine |
| **Phase 3** | Credential migration bridge & Supabase login APIs | Seamless user login transition |
| **Phase 4** | PostgreSQL RLS Policies & RBAC schema migration | Database-level security enforcement |
| **Phase 5** | Next.js Server Guards & `middleware.js` | Protected production routes & API endpoints |
