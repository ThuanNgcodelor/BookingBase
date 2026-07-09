import { baseApi } from './baseApi';

export const profileRequestApi = {
  submit: async (data) => {
    const response = await baseApi.post('/profile-requests', data);
    return response.data.data;
  },

  getPending: async (page = 0, size = 20) => {
    const response = await baseApi.get('/profile-requests/pending', {
      params: { page, size },
      _silent: true,
    });
    return response.data.data;
  },

  getMyRequests: async () => {
    const response = await baseApi.get('/profile-requests/me', { _silent: true });
    return response.data.data;
  },

  getCurrent: async () => {
    const response = await baseApi.get('/profile-requests/current', { _silent: true });
    return response.data.data;
  },

  approve: async (id, approverId) => {
    const response = await baseApi.patch(`/profile-requests/${id}/approve`, { approverId });
    return response.data.data;
  },

  reject: async (id, approverId, reason) => {
    const response = await baseApi.patch(`/profile-requests/${id}/reject`, { approverId, reason });
    return response.data.data;
  }
};
