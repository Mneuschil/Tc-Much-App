export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.178.97:3000/api/v1';
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://192.168.178.97:3000';

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
