import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { Avatar, Button, CardElevated, LoadingSkeleton } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';
import { usePermissions } from '../../src/hooks/usePermissions';
import { useWeekEvents } from '../../src/features/calendar/hooks/useEvents';
import { useTodos } from '../../src/features/todo/hooks/useTodos';
import { useNotifications } from '../../src/features/notifications/hooks/useNotifications';
import { useChannels } from '../../src/features/chat/hooks/useChannels';
import { formatDate, formatTime, formatTimeAgo } from '../../src/utils/formatDate';
import { MOCK_EVENTS, MOCK_TODOS, MOCK_NOTIFICATIONS, MOCK_CHANNELS, MOCK_MESSAGES } from '../../src/lib/mockData';
import { UserRole } from '@tennis-club/shared';

interface EventItem {
  id: string;
  title: string;
  type: string;
  startDate: string;
  isHomeGame: boolean | null;
}

interface TodoItem {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
}

export default function HomeScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { user, logout } = useAuth();
  const { hasAnyRole } = usePermissions();
  const router = useRouter();

  const { data: weekEvents, isLoading, refetch } = useWeekEvents();
  const { data: todosData } = useTodos();
  const { data: notifications } = useNotifications(true);
  const { data: channelsData } = useChannels();

  const apiEvents = weekEvents ?? [];
  const apiTodos = todosData ?? [];
  const apiNotifs = notifications ?? [];
  const apiChannels = (channelsData ?? []) as Array<{
    id: string; name: string; isDefault: boolean;
    lastMessage: { id: string; content: string; createdAt: string; author: { firstName: string; lastName: string } } | null;
  }>;

  const events = (apiEvents.length > 0 ? apiEvents : MOCK_EVENTS.slice(0, 5)) as EventItem[];
  const todos = ((apiTodos.length > 0 ? apiTodos : MOCK_TODOS) as TodoItem[]).filter(t => t.status === 'OPEN');
  const unreadCount = apiNotifs.length > 0 ? apiNotifs.length : MOCK_NOTIFICATIONS.filter(n => !n.isRead).length;

  // Ankündigungen: last message from General/Official channel
  const officialChannel = apiChannels.find(ch => ch.isDefault && ch.name.toLowerCase().includes('allgemein'))
    ?? apiChannels.find(ch => ch.isDefault);
  const announcement = officialChannel?.lastMessage ?? (MOCK_MESSAGES[0] ? {
    content: MOCK_MESSAGES[0].content,
    createdAt: MOCK_MESSAGES[0].createdAt,
    author: MOCK_MESSAGES[0].author,
  } : null);

  const canCreatePost = hasAnyRole([UserRole.CLUB_ADMIN, UserRole.BOARD_MEMBER, UserRole.TRAINER]);
  const [showComposer, setShowComposer] = useState(false);
  const [postText, setPostText] = useState('');

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
              onPress={() => router.push('/notifications' as never)}
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
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {/* Ankündigungen */}
        {announcement && (
          <View style={{ marginBottom: spacing.xxl }}>
            <Text style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.md }]}>Neuigkeiten</Text>
            <CardElevated>
              <Text style={[typography.bodySmall, { color: colors.textPrimary }]} numberOfLines={3}>
                {announcement.content}
              </Text>
              <Text style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.sm }]}>
                {announcement.author.firstName} {announcement.author.lastName} · {formatTimeAgo(announcement.createdAt)}
              </Text>
            </CardElevated>
          </View>
        )}

        <Text style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.md }]}>Diese Woche</Text>

        {/* Skeleton Loading */}
        {isLoading ? (
          <View style={{ gap: spacing.md }}>
            {[1, 2, 3].map(i => (
              <LoadingSkeleton key={i} width="100%" height={120} borderRadius={16} />
            ))}
          </View>
        ) : (
          events.map((event) => (
            <Pressable key={event.id}
              onPress={() => router.push(`/match/${event.id}` as never)}
              style={({ pressed }) => [
                { backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.md, opacity: pressed ? 0.92 : 1 },
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
                    <Text style={[typography.captionMedium, { color: event.isHomeGame ? colors.textInverse : colors.textSecondary }]}>
                      {event.isHomeGame ? 'Heim' : 'Ausw.'}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          ))
        )}

        {todos.length > 0 && (
          <View style={{ marginTop: spacing.xl }}>
            <View style={styles.sectionHeader}>
              <Text style={[typography.h4, { color: colors.textPrimary }]}>Offene Todos</Text>
              <Pressable onPress={() => router.push('/todo' as never)}>
                <Text style={[typography.captionMedium, { color: colors.primary }]}>Alle</Text>
              </Pressable>
            </View>
            {todos.slice(0, 3).map((todo) => (
              <View key={todo.id} style={[styles.todoItem, { backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.sm }]}>
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

      {/* FAB */}
      {canCreatePost && (
        <Pressable
          onPress={() => setShowComposer(true)}
          style={[styles.fab, { backgroundColor: colors.buttonPrimary }]}
        >
          <Ionicons name="add" size={24} color={colors.buttonPrimaryText} />
        </Pressable>
      )}

      {/* PostComposer Modal */}
      <Modal visible={showComposer} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, borderRadius: borderRadius.xl }]}>
            <View style={styles.modalHeader}>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>Neuer Beitrag</Text>
              <Pressable onPress={() => { setShowComposer(false); setPostText(''); }}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>
            <TextInput
              style={[styles.composerInput, {
                backgroundColor: colors.backgroundSecondary,
                borderRadius: borderRadius.lg,
                color: colors.textPrimary,
                ...typography.body,
              }]}
              placeholder="Was gibt's Neues?"
              placeholderTextColor={colors.textTertiary}
              value={postText}
              onChangeText={setPostText}
              multiline
              textAlignVertical="top"
            />
            <Button
              title="Veröffentlichen"
              onPress={() => { setShowComposer(false); setPostText(''); }}
              variant="primary"
              fullWidth
              disabled={!postText.trim()}
            />
          </View>
        </View>
      </Modal>
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
  fab: { position: 'absolute', bottom: 24, right: 20, width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  composerInput: { height: 120, padding: 16, marginBottom: 16 },
});
