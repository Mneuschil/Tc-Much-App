import { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { EmptyState, QueryError } from '../../src/components/ui';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from '../../src/features/notifications/hooks/useNotifications';
import { formatTimeAgo } from '../../src/utils/formatDate';

interface NotificationData {
  channelId?: string;
  eventId?: string;
  teamId?: string;
  tournamentId?: string;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: NotificationData;
}

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  CHAT_MESSAGE: 'chatbubble',
  MENTION: 'at',
  AVAILABILITY_REQUEST: 'hand-right',
  RESULT_CONFIRMATION: 'tennisball',
  EVENT_CHANGE: 'calendar',
  TODO: 'checkbox',
  SYSTEM: 'information-circle',
};

function getNotificationRoute(item: NotificationItem): string | null {
  const d = item.data;
  switch (item.type) {
    case 'CHAT_MESSAGE':
    case 'MENTION':
      return d?.channelId ? `/channel/${d.channelId}` : null;
    case 'AVAILABILITY_REQUEST':
    case 'RESULT_CONFIRMATION':
    case 'EVENT_CHANGE':
      return d?.eventId ? `/match/${d.eventId}` : null;
    case 'TODO':
      return '/todo';
    default:
      return null;
  }
}

export default function NotificationsScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications = (data ?? []) as NotificationItem[];

  const handleNotificationPress = useCallback(
    (item: NotificationItem) => {
      if (!item.isRead) markAsRead.mutate(item.id);
      const route = getNotificationRoute(item);
      if (route) router.push(route as never);
    },
    [markAsRead, router],
  );

  const renderNotification = useCallback(
    ({ item }: { item: NotificationItem }) => (
      <Pressable
        onPress={() => handleNotificationPress(item)}
        accessible
        accessibilityLabel={`${!item.isRead ? 'Ungelesen: ' : ''}${item.title}, ${item.body}, ${formatTimeAgo(item.createdAt)}`}
        accessibilityRole="button"
        style={[
          styles.notifCard,
          {
            backgroundColor: item.isRead ? colors.backgroundSecondary : colors.primary + '08',
            borderRadius: borderRadius.xl,
            padding: spacing.lg,
            marginBottom: spacing.sm,
          },
        ]}
      >
        <View
          style={[
            styles.notifIcon,
            {
              backgroundColor: item.isRead ? colors.surface : colors.highlight,
              borderRadius: borderRadius.lg,
            },
          ]}
          importantForAccessibility="no"
        >
          <Ionicons
            name={TYPE_ICONS[item.type] ?? 'notifications'}
            size={18}
            color={item.isRead ? colors.textSecondary : colors.accent}
          />
        </View>
        <View style={styles.notifContent}>
          <Text
            style={[
              typography.bodySmall,
              { color: colors.textPrimary, fontWeight: item.isRead ? '400' : '600' },
            ]}
          >
            {item.title}
          </Text>
          <Text
            style={[typography.caption, styles.notifBody, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {item.body}
          </Text>
          <Text style={[typography.caption, styles.notifTime, { color: colors.textTertiary }]}>
            {formatTimeAgo(item.createdAt)}
          </Text>
        </View>
        {!item.isRead && (
          <View
            style={[styles.unreadDot, { backgroundColor: colors.primary }]}
            importantForAccessibility="no"
          />
        )}
      </Pressable>
    ),
    [handleNotificationPress, colors, typography, spacing, borderRadius],
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Benachrichtigungen',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
          headerRight: () =>
            notifications.some((n) => !n.isRead) ? (
              <Pressable onPress={() => markAllAsRead.mutate()} style={styles.markAllBtn}>
                <Text style={[typography.captionMedium, { color: colors.primary }]}>
                  Alle gelesen
                </Text>
              </Pressable>
            ) : null,
        }}
      />
      <SafeAreaView
        edges={['bottom']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <FlashList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            !isLoading ? (
              isError ? (
                <QueryError onRetry={refetch} />
              ) : (
                <EmptyState title="Keine Benachrichtigungen" description="Alles gelesen" />
              )
            ) : null
          }
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start' },
  notifIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  notifContent: { flex: 1, marginLeft: 12 },
  notifBody: { marginTop: 2 },
  notifTime: { marginTop: 4 },
  markAllBtn: { paddingRight: 16 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
});
