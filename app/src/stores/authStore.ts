import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User, AuthTokens, UserRole } from '@tennis-club/shared';
import { STORAGE_KEYS } from '../lib/constants';
import { connectSocket, disconnectSocket } from '../lib/socket';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  roles: UserRole[];
  setTokens: (tokens: AuthTokens) => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  roles: [],

  setTokens: async (tokens: AuthTokens) => {
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    set({ accessToken: tokens.accessToken, isAuthenticated: true });
    connectSocket(tokens.accessToken);
  },

  setUser: (user: User) => {
    set({ user, roles: user.roles ?? [] });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    disconnectSocket();
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  loadStoredAuth: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);

      if (accessToken && refreshToken) {
        set({ accessToken, isAuthenticated: true });
        connectSocket(accessToken);
      }
    } catch {
      // Token konnte nicht geladen werden
    } finally {
      set({ isLoading: false });
    }
  },
}));
