import Cookies from 'js-cookie';

export const SESSION_DAYS = 90;
export const ACCESS_TOKEN_DAYS = 1 / 3;

const baseCookieOptions = {
  sameSite: 'Strict',
  secure: window.location.protocol === 'https:',
};

export function setAuthCookies({ accessToken, refreshToken, user }) {
  if (accessToken) {
    Cookies.set('accessToken', accessToken, { ...baseCookieOptions, expires: ACCESS_TOKEN_DAYS });
  }
  if (refreshToken) {
    Cookies.set('refreshToken', refreshToken, { ...baseCookieOptions, expires: SESSION_DAYS });
  }
  if (user) {
    Cookies.set('user', JSON.stringify(user), { ...baseCookieOptions, expires: SESSION_DAYS });
  }
}

export function clearAuthCookies() {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
  Cookies.remove('user');
}

export function isInvalidRefreshError(error) {
  const httpStatus = error.response?.status;
  const apiStatus = error.response?.data?.status;
  return error.code === 'NO_REFRESH_TOKEN' || httpStatus === 401 || apiStatus === 401;
}
