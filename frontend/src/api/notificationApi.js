import { baseApi } from './baseApi';

export const notificationApi = {
  getNotifications: async (page = 0, size = 10, unreadOnly = false) => {
    const response = await baseApi.get('/notifications', {
      params: { page, size, unreadOnly },
      _silent: true,
    });
    return response.data.data;
  },

  getUnreadCount: async () => {
    const response = await baseApi.get('/notifications/unread-count', { _silent: true });
    return response.data.data.count;
  },

  markAsRead: async (id) => {
    const response = await baseApi.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await baseApi.patch('/notifications/read-all');
    return response.data;
  },
};
