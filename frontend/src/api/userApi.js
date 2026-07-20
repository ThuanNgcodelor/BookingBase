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
  },

  getPendingRegistrations: async (page = 0, size = 10) => {
    const response = await baseApi.get('/users/registration-approvals', { params: { page, size } });
    return response.data.data;
  },

  getPendingRegistrationCount: async () => {
    const response = await baseApi.get('/users/registration-approvals/count', { _silent: true });
    return response.data.data;
  },

  approveRegistration: async (id) => {
    const response = await baseApi.patch(`/users/${id}/approve-registration`);
    return response.data.data;
  },

  rejectRegistration: async (id, reason = null) => {
    const response = await baseApi.patch(`/users/${id}/reject-registration`, { reason });
    return response.data.data;
  },
};
