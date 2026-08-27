import { ROLES, PERMISSIONS } from '../permissions';
import { hasPermission } from '../authorization';

export function canManageUsers(user) {
  return hasPermission(user, PERMISSIONS.ADMIN_USER_GOVERNANCE);
}

export function canViewTelemetry(user) {
  return hasPermission(user, PERMISSIONS.ADMIN_VIEW_TELEMETRY);
}
