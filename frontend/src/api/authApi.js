import { baseApi, refreshAccessToken } from './baseApi';
import Cookies from 'js-cookie';
import { pushApi } from './pushApi';
import { clearAppBadge } from '../utils/appBadge';
import { clearAuthCookies, isInvalidRefreshError, setAuthCookies } from './authStorage';
export const authApi = {
  setAuthData: (data) => {
    setAuthCookies(data);
  },

  updateUser: (user) => {
    setAuthCookies({ user });
  },

  silentRefresh: async () => {
    const refreshToken = Cookies.get('refreshToken');
    if (!refreshToken) return false;
    try {
      await refreshAccessToken();
      return true;
    } catch (error) {
      if (!isInvalidRefreshError(error)) throw error;
      clearAuthCookies();
      return false;
    }
  },

  login: async (email, password) => {
    const response = await baseApi.post('/auth/login', { email, password });
    authApi.setAuthData(response.data.data);
    return response.data.data;
  },

  googleLogin: async (idToken) => {
    const response = await baseApi.post('/auth/google', { idToken });
    authApi.setAuthData(response.data.data);
    return response.data.data;
  },

  requestRegisterOtp: async (email) => {
    const response = await baseApi.post('/auth/register/request-otp', { email });
    return response.data;
  },

  verifyRegisterOtp: async ({ email, otp, fullName, password }) => {
    const response = await baseApi.post('/auth/register/verify', { email, otp, fullName, password });
    return response.data;
  },

  requestForgotPasswordOtp: async (email) => {
    const response = await baseApi.post('/auth/forgot-password/request-otp', { email });
    return response.data;
  },

  resetPasswordWithOtp: async ({ email, otp, newPassword }) => {
    const response = await baseApi.post('/auth/forgot-password/reset', { email, otp, newPassword });
    return response.data;
  },

  logout: async () => {
    await unsubscribeCurrentPushSubscription();
    const refreshToken = Cookies.get('refreshToken');
    if (refreshToken) {
      try {
        await baseApi.post('/auth/logout', { refreshToken });
      } catch (e) {
        console.error('Logout API error:', e);
      }
    }
    clearAuthCookies();
    await clearAppBadge();
  },

  getUser: () => {
    const user = Cookies.get('user');
    return user ? JSON.parse(user) : null;
  }
};

async function unsubscribeCurrentPushSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      return;
    }
    const { endpoint } = subscription;
    try {
      await pushApi.unsubscribe(endpoint);
    } finally {
      await subscription.unsubscribe();
    }
  } catch (e) {
    console.error('Push unsubscribe error:', e);
  }
}
