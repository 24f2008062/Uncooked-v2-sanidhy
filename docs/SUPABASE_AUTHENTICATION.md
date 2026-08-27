# V2 Implementation Scope and Legacy Separation

## 1. Scope Clarification

The new application is being developed as a completely fresh **V2 codebase**.

The V2 application is **not an incremental upgrade of the existing application codebase**.

The only existing infrastructure that will be retained is:

```text
Existing Supabase Project
        +
Existing PostgreSQL Database
        +
Existing Production Data
```

The following legacy application components should NOT be assumed to carry forward:

```text
Existing Next.js application code

Existing NextAuth implementation

Existing authentication guards

Existing middleware

Existing API routes

Existing permission checks

Existing role caching

Existing authorization helpers

Existing frontend authorization logic

Existing server-side authorization logic

Existing payment implementation

Existing database access architecture
```

V2 should therefore be treated as:

```text
NEW APPLICATION
      +
EXISTING DATABASE
```

rather than:

```text
OLD APPLICATION
      ↓
REFACTOR
      ↓
V2
```

---

# 2. Architectural Consequence

Because V2 is a fresh implementation, the authorization architecture should be designed correctly from the beginning instead of attempting to preserve legacy authorization decisions.

The implementation should follow:

```text
Existing PostgreSQL Database
            │
            │ Adapt schema where necessary
            ▼
     New V2 Architecture
            │
            ├── New Authentication
            ├── New Authorization
            ├── New Server APIs
            ├── New Middleware
            ├── New Permission System
            ├── New RLS Policies
            └── New Security Controls
```

Legacy application code should only be reviewed as a source of:

```text
business requirements

existing workflows

existing database relationships

existing production behavior
```

It should NOT automatically be treated as the security design for V2.

---

# 3. Database Reuse Principle

The existing Supabase PostgreSQL database will remain the primary database for V2.

Therefore V2 must adapt to the existing database schema where practical.

The implementation process should be:

```text
Existing Database
      ↓
Schema Audit
      ↓
Security Classification
      ↓
Relationship Audit
      ↓
Necessary Schema Extensions
      ↓
Authorization Policies
      ↓
V2 Application Integration
```

The goal is NOT to recreate the database from scratch unless a specific table or relationship creates an unacceptable security or architectural problem.

---

# 4. Database Changes Are Allowed

Reusing the database does NOT mean the current database schema must remain unchanged.

V2 may introduce:

```text
new columns

new foreign keys

new indexes

new authorization tables

new enums

new audit fields

new ownership relationships

new constraints

new RLS policies

new database roles

new views

new helper functions
```

when required to build a secure authorization architecture.

Existing production data should be migrated/backfilled into these structures where necessary.

---

# 5. Preserve Data, Not Legacy Security Design

The primary migration requirement is:

> Preserve valid existing production data, not legacy authorization architecture.

For example, if the existing database contains:

```text
User.permissions JSON
```

V2 does not need to continue using that JSON as the authorization engine.

Instead:

```text
Existing permissions JSON
        ↓
Migration / interpretation
        ↓
New RBAC structure
```

Similarly:

```text
Existing role field
```

can remain temporarily for compatibility while the new authorization model is introduced.

---

# 6. Recommended V2 Security Architecture

Because this is a fresh codebase, authorization should be built around the target architecture rather than the old application's limitations.

Recommended V2:

```text
                 USER
                   │
                   ▼
            Authentication
                   │
                   ▼
            V2 Server Layer
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
   Authorization        Validation
          │
          ▼
     Database Access
          │
          ▼
 Existing Supabase PostgreSQL
          │
          ├── Database Roles
          ├── Constraints
          ├── RLS
          ├── Ownership
          ├── RBAC
          └── Audit Controls
```

---

# 7. Do Not Copy Legacy Auth Automatically

The existing application currently uses:

```text
NextAuth.js

JWT sessions

bcrypt passwords

custom guards

middleware authorization

60-second role cache
```

These should be considered **legacy implementation details**, not mandatory requirements for V2.

V2 should independently determine the best authentication architecture.

For example, V2 may use:

```text
Supabase Auth
```

or:

```text
Auth.js / NextAuth
```

depending on the final architectural decision.

The choice should be based on:

```text
security

database integration

RLS compatibility

operational complexity

session management

OAuth requirements

developer maintenance
```

rather than compatibility with the previous frontend/backend code.

---

# 8. Recommended Authentication Direction for V2

Because:

```text
V2 is greenfield

AND

database already lives in Supabase
```

Supabase Auth should be strongly considered for V2.

This would allow the architecture:

```text
Supabase Auth
      ↓
JWT
      ↓
auth.uid()
      ↓
PostgreSQL RLS
```

which provides cleaner database-native authorization than the legacy architecture.

The final decision should still consider whether existing user passwords and accounts need to be migrated.

---

# 9. Existing User Migration Is the Main Authentication Constraint

The most important issue when changing authentication systems is the existing:

```text
User.passwordHash
```

data.

Before switching authentication providers, determine:

```text
Can existing credentials be migrated?

Can existing bcrypt hashes be imported?

Will users need password resets?

Can accounts be linked safely?

Can email verification state be retained?
```

This must be resolved before production migration.

Authorization architecture should not be constrained by the old codebase, but authentication migration must preserve existing user access safely.

---

# 10. V2 Development Rule

No legacy authorization function should be copied into V2 without review.

Examples:

```text
requireSuperAdmin

requirePermission

requireEventManager

JWT role checks

role cache

middleware authorization
```

Each should instead be redesigned against the new authorization specification.

---

# 11. V2 Authorization Must Be Centralized

The new codebase should have one centralized authorization module from the start.

Example:

```text
src/
└── server/
    └── auth/
        ├── authentication.ts
        ├── authorization.ts
        ├── permissions.ts
        ├── policies/
        │   ├── events.ts
        │   ├── registrations.ts
        │   ├── host-applications.ts
        │   ├── support.ts
        │   └── administration.ts
        └── audit.ts
```

Avoid rebuilding the old pattern where authorization may become distributed across unrelated API routes.

---

# 12. V2 Database Adaptation Strategy

The existing database should be classified into three categories.

## Category A — Reuse As-Is

Tables whose structure already supports secure V2 authorization.

Potential examples:

```text
Event

TicketTier

Coupon

Registration
```

provided ownership and relationships are correct.

---

## Category B — Extend

Tables that are usable but need security-related fields.

Examples may include:

```text
User

EventManager

ChatMessage

Review

OpportunityApplication
```

Possible additions:

```text
ownership fields

account state

author relationships

permission fields

security metadata
```

---

## Category C — Redesign/Migrate

Structures that create security or maintainability problems.

Potential example:

```text
User.permissions JSON
```

may be migrated toward:

```text
Role
Permission
RolePermission
UserRole
```

Existing values can be preserved during migration.

---

# 13. Data Migration Principle

Changes should follow:

```text
ADD
 ↓
BACKFILL
 ↓
VERIFY
 ↓
SWITCH V2
 ↓
REMOVE LEGACY STRUCTURE LATER
```

not:

```text
DELETE OLD COLUMN
 ↓
HOPE MIGRATION WORKS
```

Example:

```text
User.permissions JSON

        ↓

Add permission tables

        ↓

Migrate existing permissions

        ↓

Verify equivalence

        ↓

V2 starts using RBAC

        ↓

Legacy permissions JSON becomes deprecated
```

---

# 14. V2 Has No Requirement to Maintain Old API Compatibility

Because the existing application is not being upgraded in-place:

```text
/api/old-route
```

does not have to remain compatible with V2.

New APIs should be designed according to:

```text
security

clear resource boundaries

validation

authorization

maintainability
```

rather than preserving legacy endpoint shapes.

---

# 15. Production Database Compatibility

The V2 database work must avoid breaking the currently deployed legacy application while both systems potentially use the same database.

Therefore database changes should initially be backward compatible.

Prefer:

```text
adding tables

adding nullable columns

adding indexes

adding constraints after backfill

adding new relationships
```

over immediately:

```text
renaming legacy columns

dropping fields

changing enum values

removing tables
```

until the legacy application is retired.

---

# 16. Parallel V1/V2 Risk

If V1 and V2 temporarily use the same Supabase database, this creates an important security consideration.

```text
V1
 │
 ├─────────────┐
 │             │
 ▼             ▼
Existing Supabase DB
 ▲
 │
V2
```

V2 authorization improvements cannot automatically make V1 secure.

For example:

```text
V2 validates permission correctly
```

but:

```text
V1 has an old vulnerable endpoint
```

means the database may still be reachable through the weaker V1 application.

Therefore security-sensitive database changes must consider both applications during the transition period.

---

# 17. V1 Retirement Requirement

Once V2 becomes production-ready:

```text
V1 write APIs should be disabled

old credentials rotated

legacy server deployments removed

unused API keys revoked

legacy privileged DB users removed

legacy authentication paths disabled

old webhooks reviewed
```

Otherwise the older application may remain an authorization bypass path.

---

# 18. Target Migration Model

The intended transition should be:

```text
                    EXISTING DATABASE
                           ▲
                           │
            ┌──────────────┴───────────────┐
            │                              │
           V1                             V2
       Legacy App                    New Codebase
            │                              │
            │                       New Security Model
            │                              │
            └──────── Transition ──────────┘
                           │
                           ▼
                       V2 Production
                           │
                           ▼
                       Retire V1
```

---

# 19. Final V2 Principle

The authorization project should therefore be treated as:

```text
NOT

"Fix the authorization of the old app."
```

It is:

```text
"Design and implement a new secure authorization system
for V2 while adapting it to the existing Supabase database
and preserving existing production data."
```

This distinction is critical.

It means the team is free to redesign:

```text
authentication

authorization

API architecture

middleware

permissions

server guards

role management

RLS

session strategy
```

without maintaining unnecessary compatibility with the old application code.

The only hard compatibility requirement is:

> **The new V2 architecture must safely work with and evolve the existing Supabase PostgreSQL database and its existing production data.**
