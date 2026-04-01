import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const notificationListener = useRef<Notifications.EventSubscription>(null);
  const responseListener = useRef<Notifications.EventSubscription>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) return;

    registerForPushNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener((_notification) => {
      // Notification empfangen waehrend App offen
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string> | undefined;
      if (!data) {
        router.push('/(tabs)/home' as never);
        return;
      }

      if (data.matchId) {
        router.push(`/match/${data.matchId}` as never);
      } else if (data.channelId) {
        router.push(`/channel/${data.channelId}` as never);
      } else if (data.tournamentId) {
        router.push(`/tournament/${data.tournamentId}` as never);
      } else if (data.todoId) {
        router.push('/todos' as never);
      } else {
        router.push('/(tabs)/home' as never);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated, router]);
}

async function registerForPushNotifications() {
  if (!Device.isDevice) {
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: projectId ?? 'default' });
  const token = tokenData.data;

  await api.post('/push', {
    token,
    platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }
}
