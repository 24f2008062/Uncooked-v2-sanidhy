import { ROLES, ROLE_PERMISSIONS } from "./permissions";

export function hasPermission(user, permission) {
  if (!user || !user.role) return false;
  const userRole = String(user.role).toUpperCase();
  if (userRole === ROLES.SUPER_ADMIN) return true;
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
}

export function hasRole(user, allowedRoles = []) {
  if (!user || !user.role) return false;
  const userRole = String(user.role).toUpperCase();
  if (userRole === ROLES.SUPER_ADMIN) return true;
  return allowedRoles.map((r) => String(r).toUpperCase()).includes(userRole);
}

export function isSuperAdmin(user) {
  return Boolean(user && String(user.role).toUpperCase() === ROLES.SUPER_ADMIN);
}
