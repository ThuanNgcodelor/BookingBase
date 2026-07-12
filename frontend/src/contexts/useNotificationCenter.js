import { useContext } from 'react';
import { NotificationListContext, NotificationUnreadContext } from './NotificationContextCore';

export function useNotificationCenter() {
  const listContext = useContext(NotificationListContext);
  const unreadContext = useContext(NotificationUnreadContext);
  if (!listContext || !unreadContext) {
    throw new Error('useNotificationCenter must be used inside NotificationProvider');
  }
  return {
    ...listContext,
    ...unreadContext,
  };
}

export function useNotificationList() {
  const context = useContext(NotificationListContext);
  if (!context) {
    throw new Error('useNotificationList must be used inside NotificationProvider');
  }
  return context;
}

export function useNotificationUnreadCount() {
  const context = useContext(NotificationUnreadContext);
  if (!context) {
    throw new Error('useNotificationUnreadCount must be used inside NotificationProvider');
  }
  return context;
}
