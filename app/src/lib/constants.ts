export { API_URL, SOCKET_URL, BACKEND_BASE_URL } from './getApiUrl';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user_data',
  THEME_MODE: 'theme_mode',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
} as const;
