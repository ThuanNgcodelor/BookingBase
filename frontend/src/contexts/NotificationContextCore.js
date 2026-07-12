import { createContext } from 'react';

export const NotificationListContext = createContext(null);
export const NotificationUnreadContext = createContext(null);

// Backward-compatible alias for older imports.
export const NotificationContext = NotificationListContext;
