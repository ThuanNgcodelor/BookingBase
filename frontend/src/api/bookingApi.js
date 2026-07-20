import { baseApi } from './baseApi';

export const bookingApi = {
  getRoomBookings: async (params, options = {}) => {
    const response = await baseApi.get('/bookings/rooms', {
      params,
      signal: options.signal,
    });
    return response.data.data;
  },

  getCarBookings: async (params, options = {}) => {
    const response = await baseApi.get('/bookings/cars', {
      params,
      signal: options.signal,
    });
    return response.data.data;
  },

  createRoomBooking: async (data) => {
    const response = await baseApi.post('/bookings/rooms', data);
    return response.data.data;
  },

  createCarBooking: async (data) => {
    const response = await baseApi.post('/bookings/cars', data);
    return response.data.data;
  },

  cancelRoomBooking: async (id) => {
    const response = await baseApi.post(`/bookings/rooms/${id}/cancel`, {});
    return response.data;
  },

  cancelCarBooking: async (id) => {
    const response = await baseApi.post(`/bookings/cars/${id}/cancel`, {});
    return response.data;
  },
};
