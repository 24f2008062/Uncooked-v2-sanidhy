import { ROLES, ROLE_PERMISSIONS } from "./permissions.js";

export function isSuperAdmin(user) {
  return Boolean(user && user.role === "SUPER_ADMIN");
}

export function hasRole(user, role) {
  if (!user || !user.role) return false;
  if (isSuperAdmin(user)) return true;
  return user.role === role;
}

export function hasPermission(user, permission) {
  if (!user || !user.role) return false;
  if (isSuperAdmin(user)) return true;
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission) || (Array.isArray(user.permissions) && user.permissions.includes(permission));
}

