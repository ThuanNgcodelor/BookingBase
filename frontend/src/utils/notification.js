export function normalizeNotification(notification) {
  if (!notification) {
    return notification;
  }

  const isRead = notification.isRead ?? notification.read ?? notification.is_read ?? false;
  const readAt = notification.readAt ?? notification.read_at ?? null;

  return {
    ...notification,
    isRead: Boolean(isRead),
    readAt,
  };
}

export function normalizeNotificationList(items) {
  return (items || []).map(normalizeNotification);
}
