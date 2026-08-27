import { ROLES, PERMISSIONS } from '../permissions';
import { hasPermission } from '../authorization';

export function canCreateEvent(user) {
  return hasPermission(user, PERMISSIONS.EVENT_CREATE);
}

export function canEditEvent(user, event) {
  if (!user) return false;
  if (user.role === ROLES.SUPER_ADMIN) return true;
  if (user.role === ROLES.ORGANIZER && event?.organizerId === user.id) return true;
  return false;
}
