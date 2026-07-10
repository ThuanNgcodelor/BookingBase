import { baseApi } from './baseApi';

export const bookingApi = {
  getRoomBookings: async (params) => {
    const response = await baseApi.get('/bookings/rooms', { params });
    return response.data.data;
  },

  getCarBookings: async (params) => {
    const response = await baseApi.get('/bookings/cars', { params });
    return response.data.data;
  },

  createRoomBooking: async (data) => {
    const response = await baseApi.post('/bookings/rooms', data);
    return response.data.data;
  },

  createCarBooking: async (data) => {
    const response = await baseApi.post('/bookings/cars', data);
    return response.data.data;
  }
};
