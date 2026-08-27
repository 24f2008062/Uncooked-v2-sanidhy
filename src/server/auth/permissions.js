/**
 * System Roles and Permission Constants for Uncooked Portal V2
 */

export const ROLES = {
  USER: 'USER',
  ORGANIZER: 'ORGANIZER',
  SUPER_ADMIN: 'SUPER_ADMIN',
};

export const PERMISSIONS = {
  // Event Permissions
  EVENT_CREATE: 'event:create',
  EVENT_EDIT_ANY: 'event:edit_any',
  EVENT_EDIT_OWN: 'event:edit_own',
  EVENT_DELETE: 'event:delete',

  // Registration & Ticketing
  REGISTRATION_CREATE: 'registration:create',
  REGISTRATION_SCAN_CHECKIN: 'registration:scan_checkin',

  // Host & KYC Governance
  HOST_APPLY: 'host:apply',
  HOST_REVIEW_KYC: 'host:review_kyc',

  // System & Administration
  ADMIN_USER_GOVERNANCE: 'admin:user_governance',
  ADMIN_VIEW_TELEMETRY: 'admin:view_telemetry',
  ADMIN_KILLSWITCH_TOGGLE: 'admin:killswitch_toggle',
};

export const ROLE_PERMISSIONS = {
  [ROLES.USER]: [
    PERMISSIONS.REGISTRATION_CREATE,
    PERMISSIONS.HOST_APPLY,
  ],
  [ROLES.ORGANIZER]: [
    PERMISSIONS.REGISTRATION_CREATE,
    PERMISSIONS.HOST_APPLY,
    PERMISSIONS.EVENT_CREATE,
    PERMISSIONS.EVENT_EDIT_OWN,
    PERMISSIONS.REGISTRATION_SCAN_CHECKIN,
  ],
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
};
