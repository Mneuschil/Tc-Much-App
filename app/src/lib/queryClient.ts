import { QueryClient, focusManager } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';

// React Native: Refetch wenn App aus dem Background zurueckkommt
function onAppStateChange(status: AppStateStatus) {
  focusManager.setFocused(status === 'active');
}

const subscription = AppState.addEventListener('change', onAppStateChange);
// Cleanup nicht noetig — QueryClient lebt die gesamte App-Lebensdauer
void subscription;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 Minuten
      retry: 2,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
