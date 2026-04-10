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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { Button } from '../../src/components/ui';
import { HeroHeader } from '../../src/components/home/HeroHeader';
import { DayAgenda, type DayEvent } from '../../src/components/calendar/DayAgenda';
import { RecentResults } from '../../src/components/home/RecentResults';
import { useAuthStore } from '../../src/stores/authStore';
import { usePermissions } from '../../src/hooks/usePermissions';
import { useWeekEvents } from '../../src/features/calendar/hooks/useEvents';
import { useTodos } from '../../src/features/todo/hooks/useTodos';
import { useNotifications } from '../../src/features/notifications/hooks/useNotifications';
import { formatDate } from '../../src/utils/formatDate';
import { toDateKey } from '../../src/utils/calendarUtils';
import { UserRole } from '@tennis-club/shared';

interface TodoItem {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
}

export default function HomeScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const user = useAuthStore((s) => s.user);
  const { hasAnyRole } = usePermissions();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const { data: weekEvents, refetch } = useWeekEvents();
  const { data: todosData } = useTodos();
  const { data: notifications } = useNotifications(true);

  const events = useMemo(() => (weekEvents ?? []) as DayEvent[], [weekEvents]);

  const todos = useMemo(
    () => ((todosData ?? []) as TodoItem[]).filter((t) => t.status === 'OPEN'),
    [todosData],
  );
  const unreadCount = (notifications ?? []).length;

  const dayEvents = useMemo<DayEvent[]>(() => {
    const key = toDateKey(selectedDate);
    return events
      .filter((e) => toDateKey(new Date(e.startDate)) === key)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [events, selectedDate]);

  const canCreatePost = hasAnyRole([UserRole.CLUB_ADMIN, UserRole.BOARD_MEMBER, UserRole.TRAINER]);
  const [showComposer, setShowComposer] = useState(false);
  const [postText, setPostText] = useState('');

  const displayName = user?.firstName ?? '';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        <HeroHeader
          displayName={displayName}
          unreadCount={unreadCount}
          events={events}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />

        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.lg }}>
          <DayAgenda events={dayEvents} />
        </View>

        <View style={{ marginTop: spacing.xxl, paddingLeft: spacing.xl }}>
          <RecentResults results={[]} />
        </View>

        {todos.length > 0 && (
          <View style={{ marginTop: spacing.xxl, paddingHorizontal: spacing.xl }}>
            <View style={styles.sectionHeader}>
              <Text
                accessibilityRole="header"
                style={[typography.h4, { color: colors.textPrimary }]}
              >
                Offene Todos
              </Text>
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
                      {formatDate(todo.dueDate)}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {canCreatePost && (
        <Pressable
          onPress={() => setShowComposer(true)}
          style={[styles.fab, { backgroundColor: colors.buttonPrimary }]}
        >
          <Ionicons name="add" size={24} color={colors.buttonPrimaryText} />
        </Pressable>
      )}

      <Modal visible={showComposer} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View
            style={[styles.modalHeader, { paddingHorizontal: spacing.xl, paddingTop: spacing.lg }]}
          >
            <Text style={[typography.h3, { color: colors.textPrimary }]}>Neuer Beitrag</Text>
            <Pressable
              onPress={() => {
                setShowComposer(false);
                setPostText('');
              }}
              hitSlop={12}
              accessibilityLabel="Modal schließen"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>
          <View style={{ paddingHorizontal: spacing.xl, flex: 1 }}>
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
              accessibilityLabel="Beitragstext"
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
        </SafeAreaView>
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
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  composerInput: { height: 120, padding: 16, marginBottom: 16 },
});
