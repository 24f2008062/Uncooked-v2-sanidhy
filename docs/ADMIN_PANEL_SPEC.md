Uncooked V2 - Admin Panel Architecture & Implementation Specification
Document Version: 2.0.0
Target Platform: Uncooked Platform V2 (Next.js 14 / Supabase / PostgreSQL)
Status: Implementation Blueprint

1. Executive Summary & Vision
The V2 Admin Panel is designed as a centralized operational console for super admins, system operators, and moderators. Built on a fresh V2 Next.js codebase while reusing the existing PostgreSQL production database, the Admin Panel features centralized RBAC, Supabase RLS integration, audit logging, real-time telemetry monitoring, and batch governance tools.

2. Security & RBAC Architecture
2.1 Roles & Hierarchy
SUPER_ADMIN
  └── ADMIN
       └── ORGANIZER (Host)
            └── USER
SUPER_ADMIN: Full platform control, role elevation/demotion, system kill-switch, database settings, global communications.
ADMIN: Platform moderation (Host KYC reviews, event moderation, support ticket resolution, opportunity management).
2.2 Granular Permissions Matrix
V2 transitions from legacy JSON strings to structured permission flags:

export enum AdminPermission {
  USERS_READ = "USERS_READ",
  USERS_WRITE = "USERS_WRITE",
  USERS_ROLES = "USERS_ROLES",
  HOSTS_AUDIT = "HOSTS_AUDIT",
  EVENTS_MODERATE = "EVENTS_MODERATE",
  COMMUNICATIONS_SEND = "COMMUNICATIONS_SEND",
  TICKETS_MANAGE = "TICKETS_MANAGE",
  INCIDENTS_MANAGE = "INCIDENTS_MANAGE",
  SETTINGS_WRITE = "SETTINGS_WRITE",
}
2.3 Server-Side Authorization Layer
All V2 admin routes enforce centralized policies:

// server/auth/authorization.ts
import { getCurrentUser } from "@/server/auth/authentication";

export async function requireAdminPermission(permission: AdminPermission) {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  
  if (user.role === "SUPER_ADMIN") return user;
  
  if (user.role === "ADMIN" && user.permissions.includes(permission)) {
    return user;
  }
  
  throw new ForbiddenError("Insufficient permissions");
}
3. Core Admin Panel Modules
/admin
 ├── /dashboard           (Telemetry, Health Metrics, Emergency Controls)
 ├── /users               (User Governance, Role Elevation, Security Audits)
 ├── /applications        (Host KYC Verification Desk & Document Viewer)
 ├── /events              (Global Event Moderation & Staff Assignments)
 ├── /communications      (Targeted Announcements & Document/Media Requests)
 ├── /support             (Support Ticket Help Desk & Internal Staff Notes)
 ├── /opportunities       (Job Board & Candidate Application Review)
 └── /settings            (Dynamic Feature Flags & Homepage Metric Overrides)
Module 1: System Telemetry & Operations Dashboard (/admin/dashboard)
Real-Time Telemetry Cards:
GMV & Total Revenue
Active Users & Registered Attendees
API Latency (P95 in ms) & DB Latency
System Memory & CPU Usage (%)
Emergency Incident & Kill-Switch Banner:
Global Platform Kill-Switch toggle (instantly pauses registration/checkout APIs).
Declare Platform Incident (SEV1_CRITICAL, SEV2_MAJOR, SEV3_MINOR).
Module 2: User Governance Console (/admin/users)
Searchable User Table: Search by name, email, department, or role. Filter by account lock status and email verification.
Role Elevation Drawer:
Promote/demote user between USER, ORGANIZER, ADMIN, SUPER_ADMIN.
Multi-select granular permission toggles (USERS_WRITE, HOSTS_AUDIT, etc.).
Account Controls:
Lock/Unlock user account (failedLoginAttempts, lockedUntil).
Force terminate active user sessions.
Batch Operations: Bulk role assignment or batch account lock.
Module 3: Host Verification & KYC Desk (/admin/applications)
Host Application Queue: Filter by status (PENDING, INFO_REQUESTED, APPROVED, REJECTED).
KYC Document Viewer Drawer:
Organization details, official domain, contact email, tax/legal IDs.
Preview attached document URLs (Identity Proof, College Authorization, Tax Docs).
Review Workflow:
Approve: Auto-elevates applicant user role to ORGANIZER and creates verified host profile.
Request Info: Triggers a notification requesting specific missing documents.
Reject: Stores explicit rejection reason sent to applicant.
Internal Notes: Staff-only commentary log (AdminNote model).
Module 4: Event Moderation Desk (/admin/events)
Global Event Explorer: Filter by status (Active, Completed, Archived), Ticket Type (Free, Paid), and Zone/City.
Moderation Controls:
Status Override: Manually transition events between Active, Completed, or Archived.
Feature Flag: Toggle event highlight on the homepage showcase.
Force Cancellation / Refund Trigger.
Event Staffing (EventManager): Assign/remove internal staff managers to specific events.
Module 5: Admin Communications & Document Request Hub (/admin/communications)
Targeted Message Composer:
Target Type: INDIVIDUAL or GROUP (ALL_USERS, ORGANIZERS, PENDING_HOSTS, VERIFIED_HOSTS, ATTENDEES).
Request Category: NOTIFICATION, DOCUMENT_REQUEST, MEDIA_REQUEST.
Fields: Subject, Instructions, Priority (NORMAL, HIGH, URGENT), Deadline.
Response Audit Queue (CommunicationRecipient):
Review submitted document links and uploaded media files.
Change review status: PENDING → REVIEWED → APPROVED / REJECTED.
Module 6: Support Ticket Help Desk (/admin/support)
Ticket Queue: Filter by Category (ACCOUNT, HOSTING, EVENT, PAYMENT, GENERAL) and Priority (LOW, MEDIUM, HIGH, URGENT).
Dual-Thread Workspace:
Public thread visible to user.
Internal staff thread (isInternal: true) for private admin collaboration.
Ticket Actions: Assign to staff member, adjust priority, mark resolved/closed.
Module 7: Opportunities Moderation (/admin/opportunities)
Opportunity Listings Manager: Create/edit postings for Internships, Bounties, Hackathons, Full-time roles.
Applicant Review Pipeline: View candidate resume links, cover messages, and transition application state (PENDING → REVIEWING → SHORTLISTED → ACCEPTED / REJECTED).
Module 8: System Settings & Feature Flags (/admin/settings)
Dynamic Key-Value Settings: Toggle feature flags without redeployment (e.g. ENABLE_RAZORPAY_PAYMENTS, ALLOW_NEW_HOST_APPLICATIONS).
Homepage Stats Manager: Override displayed platform metrics (Registrations count, Total Host count) shown on marketing pages.
4. V2 Admin API Endpoints Layout
All V2 admin API endpoints reside in the server module:

src/app/api/v2/admin/
 ├── dashboard/stats/route.ts
 ├── users/route.ts
 ├── users/[id]/role/route.ts
 ├── users/[id]/lock/route.ts
 ├── applications/route.ts
 ├── applications/[id]/review/route.ts
 ├── events/route.ts
 ├── events/[id]/moderate/route.ts
 ├── communications/route.ts
 ├── communications/responses/[id]/route.ts
 ├── support/tickets/route.ts
 ├── incidents/kill-switch/route.ts
 └── settings/route.ts
5. PostgreSQL RLS Policies for Supabase Integration
When executing queries directly via Supabase / PostgreSQL RLS, policies check auth.jwt() -> app_metadata -> role:

-- RLS Policy for System Settings
CREATE POLICY "Only Super Admins can write system settings"
ON "SystemSetting"
FOR ALL
USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'SUPER_ADMIN');

-- RLS Policy for Host Applications Audit
CREATE POLICY "Admins can view and review host applications"
ON "HostApplication"
FOR ALL
USING (auth.jwt() -> 'app_metadata' ->> 'role' IN ('ADMIN', 'SUPER_ADMIN'));
6. Phased Implementation Roadmap for V2
Phase 1: Foundation & RBAC (Days 1–3)
Set up V2 Admin Layout (/admin/layout.tsx) with dynamic navigation.
Implement server-side authorization policies (requireAdminPermission).
Build Dashboard Telemetry (/admin/dashboard) & Emergency Kill-Switch.
Phase 2: User Governance & KYC Desk (Days 4–7)
Implement User Governance table & Role Elevation drawer.
Build Host Applications queue & KYC Document Viewer modal.
Phase 3: Events & Communications (Days 8–10)
Implement Global Event Moderation & Staff assignment.
Build Admin Communication composer & Response Audit queue.
Phase 4: Support Desk & System Settings (Days 11–14)
Implement Support Ticket dual-thread desk.
Build Dynamic System Settings manager & Homepage Stats panel.
Perform end-to-end security & RBAC audits.