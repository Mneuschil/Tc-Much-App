import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';
import { STORAGE_KEYS } from '../lib/constants';
import type { ApiResponse, LoginResponse } from '@tennis-club/shared';
import type { LoginInput, RegisterInput } from '@tennis-club/shared';

export function useAuth() {
  const { user, isAuthenticated, isLoading, setTokens, setUser, logout: storeLogout } = useAuthStore();

  const login = async (input: LoginInput) => {
    const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', input);
    if (data.data) {
      await setTokens(data.data.tokens);
      setUser(data.data.user);
    }
  };

  const register = async (input: RegisterInput) => {
    const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/register', input);
    if (data.data) {
      await setTokens(data.data.tokens);
      setUser(data.data.user);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Auch bei Fehler lokal ausloggen
    }
    await storeLogout();
  };

  return { user, isAuthenticated, isLoading, login, register, logout };
}
