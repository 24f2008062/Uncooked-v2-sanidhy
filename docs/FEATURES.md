🔑 1. Authentication & Security

NextAuth & Credentials: Secure sign-up/login with bcrypt password hashing and verification tokens.
Account Lockout & Recovery: Automated account locking after repeated failed logins (failedLoginAttempts), token-based email verification, and password reset flows.
Multi-Step Onboarding: User profile configuration (department, club association, interests, portfolio URLs).
Role-Based Access Control (RBAC): Granular roles (User, Organizer, Admin, Super Admin).

🎪 2. Event Discovery & Ticketing Engine

Dynamic Event Catalog: Event creation across categories (Fest, Hackathon, Party, Workshop) with markdown schedules/prize pools.
Multi-Tiered Ticketing & Coupons: Free/Paid ticket tiers with individual capacity limits, plus discount promo code validation (Coupon).
Algorithmic Recommendations: Personalised event recommendation engine (recommendationService.js) based on interaction logs and user interest vectors.

💳 3. Registrations & Payments

Razorpay Integration: Order generation, HMAC signature verification, and webhook processing.
Passes & QR Check-In: Digital ticket issuance with single-click attendance scanner check-in (/api/registrations/[id]/checkin).
Audit Trail: State change logging via RegistrationLog.

🏛️ 4. Host Verification & KYC Workflow

Host Application Pipeline: Application submission for organizations with document URL attachments.
KYC Lifecycle Management: Admin review states (PENDING, INFO_REQUESTED, APPROVED, REJECTED), document viewer modal, and application notes.

💼 5. Opportunities & Career Board

Multitype Listings: Internships, Bounties, Freelance, and Full-time postings.
Applicant Portal: Resume link submission, pitch details, and status tracking (Pending → Shortlisted → Accepted).

🛡️ 6. Super Admin & Governance Console (/admin)

User Governance: Batch actions, role reassignment, and account locking.
Targeted Communications Hub: Sending notifications or media/document upload requests to specific user segments.
Telemetry & Incident Operations: Automated health snapshot tracker (SystemTelemetrySnapshot), emergency platform incident manager, and system kill-switch controls.
Support Ticket System: Categorized support desk with priority flags and internal staff notes.
Dynamic Settings & Stats: Key-value feature flag toggling and live homepage metric overrides.

💬 7. Community & Engagement

Live Event Chat: Real-time event chat room (ChatMessage).
Bulletin Feed: Live event announcements broadcasted by organizers.
Review System: User rating and feedback collection module.
Summary of Work
Audited Codebase: Analyzed database models (schema.prisma), Next.js routes (src/app), controllers (src/server/controllers), and services (src/server/services).
Created Artifact: Generated 
feature_audit_report.md
 containing the full architectural breakdown, feature audit report, and categorized feature catalog.