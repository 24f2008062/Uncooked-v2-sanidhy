export const TERMS_VERSION = "2026-08-27";
export const PRIVACY_VERSION = "2026-08-27";

export const LEGAL = {
  productName: "Uncooked",
  entityName: process.env.LEGAL_ENTITY_NAME || "Uncooked",
  country: "India",
  governingLaw: "the laws of India",
  grievanceOfficerName: process.env.GRIEVANCE_OFFICER_NAME || "Grievance Officer",
  grievanceEmail: process.env.GRIEVANCE_EMAIL || "support@uncooked.in",
  supportEmail: process.env.SUPPORT_EMAIL || "support@uncooked.in",
  termsVersion: TERMS_VERSION,
  privacyVersion: PRIVACY_VERSION,
  dataFiduciaryNotice:
    "Uncooked is the data fiduciary for personal data collected through this website under the Digital Personal Data Protection Act, 2023.",
};

export const ALLOWED_ROLES = Object.freeze(["USER", "ORGANIZER", "SUPER_ADMIN"]);
export const ASSIGNABLE_ROLES = Object.freeze(["USER", "ORGANIZER"]);

export const PASSWORD_MIN_LENGTH = 12;
export const LOGIN_LOCKOUT_THRESHOLD = 8;
export const LOGIN_LOCKOUT_MS = 30 * 60 * 1000;
export const SESSION_MAX_AGE_SEC = 7 * 24 * 60 * 60;
