import { ROLES, PERMISSIONS } from '../permissions';
import { hasPermission } from '../authorization';

export function canRegisterForEvent(user) {
  return !!user;
}

export function canScanCheckIn(user, event) {
  if (!user) return false;
  if (user.role === ROLES.SUPER_ADMIN) return true;
  if (user.role === ROLES.ORGANIZER && event?.organizerId === user.id) return true;
  return false;
}
