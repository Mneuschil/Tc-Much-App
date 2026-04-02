import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { Button } from '../../src/components/ui';
import { HeroHeader } from '../../src/components/home/HeroHeader';
import { DayAgenda, type DayEvent } from '../../src/components/calendar/DayAgenda';
import { NewsFeed, type NewsItem } from '../../src/components/home/NewsFeed';
import { MOCK_NEWS } from '../../src/components/home/mockNews';
import { RecentResults } from '../../src/components/home/RecentResults';
import { MOCK_RESULTS } from '../../src/components/home/mockResults';
import { useAuth } from '../../src/hooks/useAuth';
import { usePermissions } from '../../src/hooks/usePermissions';
import { useWeekEvents } from '../../src/features/calendar/hooks/useEvents';
import { useTodos } from '../../src/features/todo/hooks/useTodos';
import { useNotifications } from '../../src/features/notifications/hooks/useNotifications';
import { formatDate } from '../../src/utils/formatDate';
import { UserRole } from '@tennis-club/shared';
import { generateMockWeekEvents } from '../../src/components/calendar/mockEvents';

interface WeekEventRaw {
  id: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
  location: string | null;
  court: string | null;
  isHomeGame: boolean | null;
  team: { id: string; name: string } | null;
}

interface TodoItem {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function HomeScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { user, logout } = useAuth();
  const { hasAnyRole } = usePermissions();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const { data: weekEvents, refetch } = useWeekEvents();
  const { data: todosData } = useTodos();
  const { data: notifications } = useNotifications(true);

  const mockEvents = useMemo(() => generateMockWeekEvents(), []);
  const events = useMemo(() => {
    const api = (weekEvents ?? []) as WeekEventRaw[];
    return [...api, ...mockEvents];
  }, [weekEvents, mockEvents]);

  const todos = ((todosData ?? []) as TodoItem[]).filter((t) => t.status === 'OPEN');
  const unreadCount = (notifications ?? []).length;
  const newsItems: NewsItem[] = MOCK_NEWS;

  const dayEvents = useMemo<DayEvent[]>(() => {
    const key = toDateKey(selectedDate);
    return events
      .filter((e) => toDateKey(new Date(e.startDate)) === key)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [events, selectedDate]);

  const canCreatePost = hasAnyRole([UserRole.CLUB_ADMIN, UserRole.BOARD_MEMBER, UserRole.TRAINER]);
  const [showComposer, setShowComposer] = useState(false);
  const [postText, setPostText] = useState('');

  const displayName = user?.firstName ?? 'Marius';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {/* Hero mit Bild + Kalender */}
        <HeroHeader
          displayName={displayName}
          unreadCount={unreadCount}
          events={events}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />

        {/* Tagesansicht */}
        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.lg }}>
          <DayAgenda events={dayEvents} />
        </View>

        {/* Ergebnisse */}
        <View style={{ marginTop: spacing.xxl, paddingLeft: spacing.xl }}>
          <RecentResults results={MOCK_RESULTS} />
        </View>

        {/* Neuigkeiten */}
        <View style={{ marginTop: spacing.xxl, paddingLeft: spacing.xl }}>
          <NewsFeed items={newsItems} />
        </View>

        {/* Offene Todos */}
        {todos.length > 0 && (
          <View style={{ marginTop: spacing.xxl, paddingHorizontal: spacing.xl }}>
            <View style={styles.sectionHeader}>
              <Text style={[typography.h4, { color: colors.textPrimary }]}>Offene Todos</Text>
              <Pressable onPress={() => router.push('/todo' as never)}>
                <Text style={[typography.captionMedium, { color: colors.primary }]}>Alle</Text>
              </Pressable>
            </View>
            {todos.slice(0, 3).map((todo) => (
              <View
                key={todo.id}
                style={[
                  styles.todoItem,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: borderRadius.xl,
                    padding: spacing.lg,
                    marginBottom: spacing.sm,
                  },
                ]}
              >
                <View
                  style={[
                    styles.todoCheck,
                    { borderColor: colors.primary, borderRadius: borderRadius.xs },
                  ]}
                />
                <View style={{ marginLeft: spacing.md, flex: 1 }}>
                  <Text style={[typography.bodySmall, { color: colors.textPrimary }]}>
                    {todo.title}
                  </Text>
                  {todo.dueDate && (
                    <Text
                      style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}
                    >
                      Fällig: {formatDate(todo.dueDate)}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ marginTop: 40, paddingHorizontal: spacing.xl }}>
          <Button
            title="Abmelden"
            onPress={async () => {
              await logout();
              router.replace('/(auth)/welcome');
            }}
            variant="outline"
            fullWidth
          />
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
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background, borderRadius: borderRadius.xl },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>Neuer Beitrag</Text>
              <Pressable
                onPress={() => {
                  setShowComposer(false);
                  setPostText('');
                }}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>
            <TextInput
              style={[
                styles.composerInput,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: borderRadius.lg,
                  color: colors.textPrimary,
                  ...typography.body,
                },
              ]}
              placeholder="Was gibt's Neues?"
              placeholderTextColor={colors.textTertiary}
              value={postText}
              onChangeText={setPostText}
              multiline
              textAlignVertical="top"
            />
            <Button
              title="Veröffentlichen"
              onPress={() => {
                setShowComposer(false);
                setPostText('');
              }}
              variant="primary"
              fullWidth
              disabled={!postText.trim()}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  todoItem: { flexDirection: 'row', alignItems: 'center' },
  todoCheck: { width: 20, height: 20, borderWidth: 1.5 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { padding: 20, paddingBottom: 40 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  composerInput: { height: 120, padding: 16, marginBottom: 16 },
});
