import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { Avatar, Button } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';
import { useWeekEvents } from '../../src/features/calendar/hooks/useEvents';
import { useTodos } from '../../src/features/todo/hooks/useTodos';
import { useNotifications } from '../../src/features/notifications/hooks/useNotifications';
import { formatDate, formatTime } from '../../src/utils/formatDate';
import { MOCK_EVENTS, MOCK_TODOS, MOCK_NOTIFICATIONS } from '../../src/lib/mockData';

export default function HomeScreen() {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();

  const { data: weekEvents, isLoading, refetch } = useWeekEvents();
  const { data: todosData } = useTodos();
  const { data: notifications } = useNotifications(true);

  const apiEvents = weekEvents ?? [];
  const apiTodos = todosData ?? [];
  const apiNotifs = notifications ?? [];

  const events = apiEvents.length > 0 ? apiEvents : MOCK_EVENTS.slice(0, 5);
  const todos = (apiTodos.length > 0 ? apiTodos : MOCK_TODOS).filter((t: any) => t.status === 'OPEN');
  const unreadCount = apiNotifs.length > 0 ? apiNotifs.length : MOCK_NOTIFICATIONS.filter(n => !n.isRead).length;

  const displayName = user?.firstName ?? 'Marius';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.xl, paddingTop: spacing.lg }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.h1, { color: colors.textPrimary }]}>Hallo, {displayName}</Text>
            <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              Willkommen bei TC Much
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              onPress={() => router.push('/notifications' as any)}
              style={[styles.iconButton, { backgroundColor: colors.highlight, borderRadius: borderRadius.lg }]}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.primaryDark} />
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                  <Text style={{ color: colors.primaryDark, fontSize: 9, fontWeight: '700' }}>{unreadCount}</Text>
                </View>
              )}
            </Pressable>
            <Avatar firstName={displayName} lastName={user?.lastName ?? 'User'} imageUrl={user?.avatarUrl} size="md" />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
      >
        <Text style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.md }]}>Diese Woche</Text>

        {events.map((event: any) => (
          <Pressable key={event.id}
            onPress={() => router.push(`/match/${event.id}` as any)}
            style={({ pressed }) => [
              { backgroundColor: colors.cardBackground, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.md, opacity: pressed ? 0.92 : 1, ...shadows.sm },
            ]}
          >
            <View style={styles.eventRow}>
              <View style={[styles.eventDot, {
                backgroundColor: event.type?.includes('MATCH') ? colors.primary : event.type === 'TRAINING' ? colors.success : colors.accent,
                borderRadius: borderRadius.full,
              }]} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={[typography.bodyMedium, { color: colors.textPrimary }]} numberOfLines={1}>{event.title}</Text>
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                  {formatDate(event.startDate)} · {formatTime(event.startDate)}
                </Text>
              </View>
              {event.isHomeGame !== null && event.isHomeGame !== undefined && (
                <View style={[styles.chip, { backgroundColor: event.isHomeGame ? colors.chipActive : colors.chipInactive, borderRadius: borderRadius.full }]}>
                  <Text style={[typography.captionMedium, { color: event.isHomeGame ? '#FFFFFF' : colors.textSecondary }]}>
                    {event.isHomeGame ? 'Heim' : 'Ausw.'}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        ))}

        {todos.length > 0 && (
          <View style={{ marginTop: spacing.xl }}>
            <View style={styles.sectionHeader}>
              <Text style={[typography.h4, { color: colors.textPrimary }]}>Offene Todos</Text>
              <Pressable onPress={() => router.push('/todo' as any)}>
                <Text style={[typography.captionMedium, { color: colors.primary }]}>Alle</Text>
              </Pressable>
            </View>
            {todos.slice(0, 3).map((todo: any) => (
              <View key={todo.id} style={[styles.todoItem, { backgroundColor: colors.cardBackground, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.sm, ...shadows.sm }]}>
                <View style={[styles.todoCheck, { borderColor: colors.primary, borderRadius: borderRadius.xs }]} />
                <View style={{ marginLeft: spacing.md, flex: 1 }}>
                  <Text style={[typography.bodySmall, { color: colors.textPrimary }]}>{todo.title}</Text>
                  {todo.dueDate && <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>Faellig: {formatDate(todo.dueDate)}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ marginTop: 40 }}>
          <Button title="Abmelden" onPress={async () => { await logout(); router.replace('/(auth)/welcome'); }} variant="outline" fullWidth />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {},
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  eventRow: { flexDirection: 'row', alignItems: 'center' },
  eventDot: { width: 10, height: 10 },
  chip: { paddingHorizontal: 10, paddingVertical: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  todoItem: { flexDirection: 'row', alignItems: 'center' },
  todoCheck: { width: 20, height: 20, borderWidth: 1.5 },
});
