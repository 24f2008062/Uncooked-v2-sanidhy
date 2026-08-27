import { ROLES, PERMISSIONS } from '../permissions';
import { hasPermission } from '../authorization';

export function canSubmitHostApplication(user) {
  return !!user;
}

export function canReviewHostApplication(user) {
  return hasPermission(user, PERMISSIONS.HOST_REVIEW_KYC);
}
