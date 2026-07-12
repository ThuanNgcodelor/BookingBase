import { baseApi } from './baseApi';

export const resourceApi = {
  getRooms: async (options = {}) => {
    const response = await baseApi.get('/resources/rooms', {
      signal: options.signal,
    });
    return response.data.data;
  },
  
  getCars: async (options = {}) => {
    const response = await baseApi.get('/resources/cars', {
      signal: options.signal,
    });
    return response.data.data;
  }
};
