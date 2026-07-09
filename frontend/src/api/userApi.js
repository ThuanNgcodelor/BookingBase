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

  getDepartments: async () => {
    const response = await baseApi.get('/departments');
    return response.data.data;
  }
};
