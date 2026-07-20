import { baseApi } from './baseApi';

export const userApi = {
  getApprovers: async () => {
    const response = await baseApi.get('/users/approvers');
    return response.data.data;
  },

  getMe: async () => {
    const response = await baseApi.get('/users/me');
    return response.data.data;
  },

  updateAvatar: async (avatarUrl) => {
    const response = await baseApi.patch('/users/me/avatar', { avatarUrl });
    return response.data.data;
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    const response = await baseApi.patch('/users/me/password', { currentPassword, newPassword });
    return response.data;
  },

  getDepartments: async () => {
    const response = await baseApi.get('/departments');
    return response.data.data;
  },

  createUser: async (payload) => {
    const response = await baseApi.post('/users', payload);
    return response.data.data;
  }
};
