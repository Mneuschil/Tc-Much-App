import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../src/lib/queryClient';
import { useAuthStore } from '../src/stores/authStore';
import { useThemeStore } from '../src/stores/themeStore';
import { useColorScheme } from 'react-native';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { ToastProvider } from '../src/components/ui/Toast';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loadStoredAuth = useAuthStore((s) => s.loadStoredAuth);
  const isLoading = useAuthStore((s) => s.isLoading);
  const initTheme = useThemeStore((s) => s.initTheme);
  const colorScheme = useColorScheme();

  useEffect(() => {
    async function init() {
      await initTheme(colorScheme === 'dark');
      await loadStoredAuth();
    }
    init();
  }, [colorScheme, initTheme, loadStoredAuth]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ErrorBoundary>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </ErrorBoundary>
        <StatusBar style="auto" />
      </ToastProvider>
    </QueryClientProvider>
  );
}
