export function resolveNotificationTarget(notification = {}) {
  const type = String(notification.type || '');
  const sourceType = String(notification.sourceType || '');
  const sourceId = notification.sourceId;

  if (type === 'BOOKING_PENDING_APPROVAL' && sourceId
      && (sourceType === 'BOOKING_ROOM' || sourceType === 'BOOKING_CAR')) {
    return `/admin/approvals/${sourceId}`;
  }
  if (type === 'PROFILE_UPDATE_REQUESTED' && sourceId) {
    return `/admin/profile-approvals/${sourceId}`;
  }
  if (type === 'PROFILE_UPDATE_APPROVED' || type === 'PROFILE_UPDATE_REJECTED') {
    return '/profile';
  }
  if (type === 'ACCOUNT_REGISTRATION_REQUESTED') {
    return '/admin/users?tab=pending';
  }
  if (type === 'ACCOUNT_REGISTRATION_PENDING'
      || type === 'ACCOUNT_REGISTRATION_APPROVED'
      || type === 'ACCOUNT_REGISTRATION_REJECTED') {
    return '/login';
  }
  if (notification.targetUrl) {
    return notification.targetUrl;
  }
  if (sourceType === 'BOOKING_ROOM') return '/rooms';
  if (sourceType === 'BOOKING_CAR') return '/cars';
  if (sourceType === 'PROFILE_UPDATE_REQUEST') return '/profile';
  return '/notifications';
}
