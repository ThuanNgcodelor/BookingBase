import { baseApi } from './baseApi';

export const approvalApi = {
  getHistory: async (params = {}) => {
    const response = await baseApi.get('/approvals/history', { params });
    return response.data.data;
  },

  getRoomApprovalSteps: async (id) => {
    const response = await baseApi.get(`/approvals/rooms/${id}/steps`);
    return response.data.data;
  },

  getCarApprovalSteps: async (id) => {
    const response = await baseApi.get(`/approvals/cars/${id}/steps`);
    return response.data.data;
  },

  approveRoom: async (id, data) => {
    const response = await baseApi.post(`/approvals/rooms/${id}/approve`, data);
    return response.data;
  },

  rejectRoom: async (id, data) => {
    const response = await baseApi.post(`/approvals/rooms/${id}/reject`, data);
    return response.data;
  },

  approveCar: async (id, data) => {
    const response = await baseApi.post(`/approvals/cars/${id}/approve`, data);
    return response.data;
  },

  rejectCar: async (id, data) => {
    const response = await baseApi.post(`/approvals/cars/${id}/reject`, data);
    return response.data;
  }
};
