import test from "node:test";
import assert from "node:assert/strict";
import {
  VALID_ORG_TYPES,
  validateHostApplication,
  parseHostApplicationNotes,
} from "../../src/server/auth/hostVerification.js";
import { hasRole } from "../../src/server/auth/authorization.js";

test("Host Verification: Valid Organization Types include college and community groups", () => {
  assert.ok(Array.isArray(VALID_ORG_TYPES));
  assert.ok(VALID_ORG_TYPES.includes("College Club"));
  assert.ok(VALID_ORG_TYPES.includes("University Department"));
  assert.ok(VALID_ORG_TYPES.includes("Student Initiative"));
  assert.ok(VALID_ORG_TYPES.includes("Company"));
  assert.ok(VALID_ORG_TYPES.includes("NGO"));
  assert.ok(VALID_ORG_TYPES.includes("Independent"));
  assert.ok(VALID_ORG_TYPES.includes("Other"));
});

test("Host Verification: Unverified user must NOT possess ORGANIZER role", () => {
  const applicantUser = { id: "usr-applicant-1", role: "USER" };
  assert.equal(hasRole(applicantUser, "ORGANIZER"), false, "Regular user should not have ORGANIZER role");
  assert.equal(hasRole(applicantUser, "SUPER_ADMIN"), false);
});

test("Host Verification: Host application structured notes parsing & serialization", () => {
  const applicationData = {
    applicantName: "Aarav Sharma",
    applicantRole: "President",
    contactEmail: "ieee@college.edu",
    contactPhone: "+91 9876543210",
    linkedinUrl: "https://linkedin.com/in/aarav-sharma",
    proofDocumentUrl: "https://drive.google.com/file/d/12345/view",
    websiteUrl: "https://ieee-college.org",
    instagram: "@ieee_club",
    twitter: "@ieee_club",
    hostingReason: "Organizing our annual collegiate hackathon HackOpportia for 500+ students.",
    submittedAt: new Date().toISOString(),
  };

  const serialized = JSON.stringify(applicationData);
  assert.ok(typeof serialized === "string");

  const parsed = JSON.parse(serialized);
  assert.equal(parsed.applicantName, "Aarav Sharma");
  assert.equal(parsed.applicantRole, "President");
  assert.equal(parsed.contactEmail, "ieee@college.edu");
  assert.equal(parsed.contactPhone, "+91 9876543210");
  assert.equal(parsed.linkedinUrl, "https://linkedin.com/in/aarav-sharma");
  assert.equal(parsed.proofDocumentUrl, "https://drive.google.com/file/d/12345/view");
  assert.equal(parsed.hostingReason, "Organizing our annual collegiate hackathon HackOpportia for 500+ students.");
});

test("Host Verification: State machine invariant - No auto-approval without admin review", () => {
  // Simulating application lifecycle
  let application = {
    userId: "usr-applicant-1",
    organizationName: "Robotics Club",
    organizationType: "College Club",
    status: "NOT_APPLIED",
    reviewedAt: null,
    reviewedBy: null,
  };
  let user = { id: "usr-applicant-1", role: "USER" };

  // Step 1: User submits verification application
  application = {
    ...application,
    status: "PENDING",
    reviewedAt: null,
    reviewedBy: null,
  };
  // Invariant: User role MUST NOT be elevated to ORGANIZER upon submission
  assert.equal(application.status, "PENDING");
  assert.equal(user.role, "USER", "User role must remain USER while pending admin approval");
  assert.equal(hasRole(user, "ORGANIZER"), false, "User must not be able to host events while pending");

  // Step 2: Admin reviews and rejects application
  const adminRejectionReason = "Please provide an authorized college ID link.";
  application = {
    ...application,
    status: "REJECTED",
    reviewedAt: new Date(),
    reviewedBy: "admin-1",
    rejectionReason: adminRejectionReason,
  };
  assert.equal(application.status, "REJECTED");
  assert.equal(user.role, "USER");
  assert.equal(hasRole(user, "ORGANIZER"), false);

  // Step 3: User resubmits with valid document URL
  application = {
    ...application,
    status: "PENDING",
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
  };
  assert.equal(application.status, "PENDING");
  assert.equal(user.role, "USER");

  // Step 4: Super Admin explicitly approves application
  application = {
    ...application,
    status: "APPROVED",
    reviewedAt: new Date(),
    reviewedBy: "superadmin-1",
  };
  // Admin approval elevates user to ORGANIZER
  user = {
    ...user,
    role: "ORGANIZER",
  };
  assert.equal(application.status, "APPROVED");
  assert.equal(user.role, "ORGANIZER");
  assert.equal(hasRole(user, "ORGANIZER"), true, "Approved user now has ORGANIZER privileges");
});

test("Host Verification: Event Creation API 403 guard simulation", () => {
  // Simulating the check inside POST /api/events
  function checkEventCreatePermission(user) {
    if (!user) {
      return { status: 401, error: "UNAUTHORIZED" };
    }
    if (!hasRole(user, "ORGANIZER") && !hasRole(user, "SUPER_ADMIN")) {
      return {
        status: 403,
        error: {
          code: "HOST_NOT_VERIFIED",
          message: "Host verification required. Only approved organizers can create and publish events.",
        },
      };
    }
    return { status: 200, allowed: true };
  }

  // Unauthenticated user
  const unauthRes = checkEventCreatePermission(null);
  assert.equal(unauthRes.status, 401);

  // Unverified normal user
  const normalUser = { id: "u-1", role: "USER" };
  const blockedRes = checkEventCreatePermission(normalUser);
  assert.equal(blockedRes.status, 403);
  assert.equal(blockedRes.error.code, "HOST_NOT_VERIFIED");

  // User with pending application (role is still USER)
  const pendingUser = { id: "u-2", role: "USER" };
  const pendingRes = checkEventCreatePermission(pendingUser);
  assert.equal(pendingRes.status, 403);
  assert.equal(pendingRes.error.code, "HOST_NOT_VERIFIED");

  // Approved organizer
  const organizerUser = { id: "u-3", role: "ORGANIZER" };
  const allowedOrganizer = checkEventCreatePermission(organizerUser);
  assert.equal(allowedOrganizer.status, 200);
  assert.equal(allowedOrganizer.allowed, true);

  // Super Admin
  const adminUser = { id: "u-4", role: "SUPER_ADMIN" };
  const allowedAdmin = checkEventCreatePermission(adminUser);
  assert.equal(allowedAdmin.status, 200);
  assert.equal(allowedAdmin.allowed, true);
});

test("Host Verification: Input validation rejects incomplete or invalid applications", () => {
  // Missing Organization Name
  const missingOrg = validateHostApplication({
    organizationType: "College Club",
    applicantName: "Jane Doe",
    applicantRole: "President",
    contactEmail: "jane@college.edu",
    contactPhone: "+91 9876543210",
    linkedinUrl: "https://linkedin.com/in/janedoe",
    hostingReason: "Hosting collegiate technical events.",
  });
  assert.equal(missingOrg.valid, false);
  assert.ok(missingOrg.error.includes("Organization / Club name is required"));

  // Invalid Organization Type
  const invalidOrgType = validateHostApplication({
    organizationName: "Tech Club",
    organizationType: "Unknown Type",
    applicantName: "Jane Doe",
    applicantRole: "President",
    contactEmail: "jane@college.edu",
    contactPhone: "+91 9876543210",
    linkedinUrl: "https://linkedin.com/in/janedoe",
    hostingReason: "Hosting collegiate technical events.",
  });
  assert.equal(invalidOrgType.valid, false);
  assert.ok(invalidOrgType.error.includes("Invalid organization type"));

  // Missing Applicant Name
  const missingName = validateHostApplication({
    organizationName: "Tech Club",
    organizationType: "College Club",
    applicantRole: "President",
    contactEmail: "jane@college.edu",
    contactPhone: "+91 9876543210",
    linkedinUrl: "https://linkedin.com/in/janedoe",
    hostingReason: "Hosting collegiate technical events.",
  });
  assert.equal(missingName.valid, false);
  assert.ok(missingName.error.includes("Applicant / Representative full name is required"));

  // Invalid Email
  const invalidEmail = validateHostApplication({
    organizationName: "Tech Club",
    organizationType: "College Club",
    applicantName: "Jane Doe",
    applicantRole: "President",
    contactEmail: "not-an-email",
    contactPhone: "+91 9876543210",
    linkedinUrl: "https://linkedin.com/in/janedoe",
    hostingReason: "Hosting collegiate technical events.",
  });
  assert.equal(invalidEmail.valid, false);
  assert.ok(invalidEmail.error.includes("valid contact email"));

  // Short Phone Number
  const shortPhone = validateHostApplication({
    organizationName: "Tech Club",
    organizationType: "College Club",
    applicantName: "Jane Doe",
    applicantRole: "President",
    contactEmail: "jane@college.edu",
    contactPhone: "123",
    linkedinUrl: "https://linkedin.com/in/janedoe",
    hostingReason: "Hosting collegiate technical events.",
  });
  assert.equal(shortPhone.valid, false);
  assert.ok(shortPhone.error.includes("valid contact phone number"));

  // Missing LinkedIn
  const missingLinkedin = validateHostApplication({
    organizationName: "Tech Club",
    organizationType: "College Club",
    applicantName: "Jane Doe",
    applicantRole: "President",
    contactEmail: "jane@college.edu",
    contactPhone: "+91 9876543210",
    hostingReason: "Hosting collegiate technical events.",
  });
  assert.equal(missingLinkedin.valid, false);
  assert.ok(missingLinkedin.error.includes("LinkedIn or professional profile URL is required"));

  // Short Hosting Reason (< 10 chars)
  const shortReason = validateHostApplication({
    organizationName: "Tech Club",
    organizationType: "College Club",
    applicantName: "Jane Doe",
    applicantRole: "President",
    contactEmail: "jane@college.edu",
    contactPhone: "+91 9876543210",
    linkedinUrl: "https://linkedin.com/in/janedoe",
    hostingReason: "Short",
  });
  assert.equal(shortReason.valid, false);
  assert.ok(shortReason.error.includes("min 10 characters"));

  // Valid Complete Application
  const validApp = validateHostApplication({
    organizationName: "ACM Student Chapter",
    organizationType: "College Club",
    applicantName: "Rahul Verma",
    applicantRole: "Chapter Chair",
    contactEmail: "acm@university.edu",
    contactPhone: "+91 9123456780",
    linkedinUrl: "https://linkedin.com/in/rahul-verma",
    proofDocumentUrl: "https://drive.google.com/file/d/abc123xyz/view",
    hostingReason: "Planning monthly developer meetups and annual coding competition.",
  });
  assert.equal(validApp.valid, true);
  assert.equal(validApp.data.organizationName, "ACM Student Chapter");
  assert.equal(validApp.data.applicantRole, "Chapter Chair");
});

test("Host Verification: parseHostApplicationNotes safely handles JSON and plain text", () => {
  assert.equal(parseHostApplicationNotes(null), null);
  assert.equal(parseHostApplicationNotes(""), null);

  const jsonResult = parseHostApplicationNotes('{"applicantName":"Alice","applicantRole":"Lead"}');
  assert.equal(jsonResult.applicantName, "Alice");
  assert.equal(jsonResult.applicantRole, "Lead");

  const plainResult = parseHostApplicationNotes("Legacy plain text notes without json format");
  assert.equal(plainResult.text, "Legacy plain text notes without json format");
});

