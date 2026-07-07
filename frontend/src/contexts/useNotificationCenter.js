import { useContext } from 'react';
import { NotificationContext } from './NotificationContextCore';

export function useNotificationCenter() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationCenter must be used inside NotificationProvider');
  }
  return context;
}
