import { ROLES, ROLE_PERMISSIONS } from './permissions';

/**
 * Checks if a user has a specific permission
 */
export function hasPermission(user, permission) {
  if (!user || !user.role) return false;
  
  if (user.role === ROLES.SUPER_ADMIN) return true;

  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(permission);
}

/**
 * Enforces role restriction (throws error or returns boolean)
 */
export function hasRole(user, allowedRoles = []) {
  if (!user || !user.role) return false;
  if (user.role === ROLES.SUPER_ADMIN) return true;
  return allowedRoles.includes(user.role);
}
