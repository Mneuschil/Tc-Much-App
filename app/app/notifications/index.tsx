import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { EmptyState } from '../../src/components/ui';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../../src/features/notifications/hooks/useNotifications';
import { formatTimeAgo } from '../../src/utils/formatDate';
import { MOCK_NOTIFICATIONS } from '../../src/lib/mockData';

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  CHAT_MESSAGE: 'chatbubble', MENTION: 'at', AVAILABILITY_REQUEST: 'hand-right',
  RESULT_CONFIRMATION: 'tennisball', EVENT_CHANGE: 'calendar', TODO: 'checkbox', SYSTEM: 'information-circle',
};

export default function NotificationsScreen() {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const { data, isLoading, refetch } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const apiNotifs = ((data ?? []) as any[]);
  const notifications = apiNotifs.length > 0 ? apiNotifs : MOCK_NOTIFICATIONS;

  const renderNotification = ({ item }: { item: any }) => (
    <Pressable onPress={() => { if (!item.isRead) markAsRead.mutate(item.id); }}
      style={[styles.notifCard, {
        backgroundColor: item.isRead ? colors.cardBackground : colors.primary + '08',
        borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.sm,
        ...(item.isRead ? shadows.sm : {}),
      }]}>
      <View style={[styles.notifIcon, { backgroundColor: item.isRead ? colors.surface : colors.highlight, borderRadius: borderRadius.lg }]}>
        <Ionicons name={TYPE_ICONS[item.type] ?? 'notifications'} size={18} color={item.isRead ? colors.textSecondary : colors.accent} />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={[typography.bodySmall, { color: colors.textPrimary, fontWeight: item.isRead ? '400' : '600' }]}>{item.title}</Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={2}>{item.body}</Text>
        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 4 }]}>{formatTimeAgo(item.createdAt)}</Text>
      </View>
      {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
    </Pressable>
  );

  return (
    <>
      <Stack.Screen options={{
        headerShown: true, title: 'Benachrichtigungen',
        headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.textPrimary, headerShadowVisible: false,
        headerRight: () => notifications.some((n: any) => !n.isRead) ? (
          <Pressable onPress={() => markAllAsRead.mutate()} style={{ paddingRight: spacing.lg }}>
            <Text style={[typography.captionMedium, { color: colors.primary }]}>Alle gelesen</Text>
          </Pressable>
        ) : null,
      }} />
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
        <FlatList data={notifications} keyExtractor={(item) => item.id} renderItem={renderNotification}
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
          ListEmptyComponent={!isLoading ? <EmptyState title="Keine Benachrichtigungen" description="Alles gelesen" /> : null}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start' },
  notifIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
});
