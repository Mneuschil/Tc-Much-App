import { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, type DateData } from 'react-native-calendars';
import type { MarkedDates } from 'react-native-calendars/src/types';
import { Ionicons } from '@expo/vector-icons';
import { differenceInHours } from 'date-fns';
import { useTheme } from '../../src/theme';
import { Badge, Avatar, EmptyState } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';
import { usePermissions } from '../../src/hooks/usePermissions';
import { useEvents } from '../../src/features/calendar/hooks/useEvents';
import { useSetTrainingAttendance, useTrainerOverview } from '../../src/features/training/hooks/useTraining';
import { formatDate, formatTime } from '../../src/utils/formatDate';
import { MOCK_EVENTS } from '../../src/lib/mockData';

const EVENT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  LEAGUE_MATCH: 'tennisball', CUP_MATCH: 'trophy', CLUB_CHAMPIONSHIP: 'medal',
  RANKING_MATCH: 'stats-chart', TRAINING: 'fitness', CLUB_EVENT: 'people', TOURNAMENT: 'trophy-outline',
};

interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
  location: string | null;
  isHomeGame: boolean | null;
  teamId: string | null;
}

function getDotColor(type: string): string {
  if (type === 'LEAGUE_MATCH' || type === 'CUP_MATCH') return '#FF3B30';
  if (type === 'TOURNAMENT' || type === 'CLUB_CHAMPIONSHIP' || type === 'RANKING_MATCH') return '#023320';
  if (type === 'CLUB_EVENT') return '#0EA65A';
  if (type === 'TRAINING') return '#8E8E93';
  return '#8E8E93';
}

function toDateKey(dateStr: string): string {
  return new Date(dateStr).toISOString().slice(0, 10);
}

export default function CalendarScreen() {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const router = useRouter();
  const { isTrainer } = usePermissions();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [trainerModalVisible, setTrainerModalVisible] = useState(false);

  const { data, isLoading, refetch } = useEvents();
  const apiEvents = (data ?? []) as CalendarEvent[];
  const allEvents: CalendarEvent[] = apiEvents.length > 0 ? apiEvents : MOCK_EVENTS;

  const markedDates = useMemo<MarkedDates>(() => {
    const marks: MarkedDates = {};
    for (const event of allEvents) {
      const key = toDateKey(event.startDate);
      const dot = { key: event.id, color: getDotColor(event.type) };
      if (marks[key]) {
        const existing = marks[key];
        const dots = existing.dots ? [...existing.dots, dot] : [dot];
        marks[key] = { ...existing, dots };
      } else {
        marks[key] = { dots: [dot] };
      }
    }
    if (selectedDate && marks[selectedDate]) {
      marks[selectedDate] = { ...marks[selectedDate], selected: true };
    } else if (selectedDate) {
      marks[selectedDate] = { selected: true, dots: [] };
    }
    return marks;
  }, [allEvents, selectedDate]);

  const filteredEvents = useMemo(() => {
    if (!selectedDate) {
      const now = new Date();
      return allEvents
        .filter(e => new Date(e.startDate) >= now)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }
    return allEvents
      .filter(e => toDateKey(e.startDate) === selectedDate)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [allEvents, selectedDate]);

  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDate(prev => (prev === day.dateString ? null : day.dateString));
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm }}>
        <Text style={[typography.h1, { color: colors.textPrimary }]}>Kalender</Text>
      </View>
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AgendaItem event={item} isTrainer={isTrainer} onShowTrainerOverview={() => setTrainerModalVisible(true)} />
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
            <Calendar
              markingType="multi-dot"
              markedDates={markedDates}
              onDayPress={handleDayPress}
              theme={{
                backgroundColor: colors.background,
                calendarBackground: colors.background,
                todayTextColor: colors.accentLight,
                selectedDayBackgroundColor: colors.accent,
                selectedDayTextColor: '#FFFFFF',
                arrowColor: colors.accent,
                dayTextColor: colors.textPrimary,
                textDisabledColor: colors.textTertiary,
                monthTextColor: colors.textPrimary,
                textMonthFontWeight: '700',
                textMonthFontSize: 17,
                textDayFontSize: 14,
                textDayHeaderFontSize: 12,
                dotStyle: { marginTop: 2 },
              }}
            />
            {selectedDate && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg }}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>{formatDate(selectedDate)}</Text>
                <Pressable onPress={() => setSelectedDate(null)}>
                  <Text style={[typography.bodySmall, { color: colors.accentLight }]}>Alle anzeigen</Text>
                </Pressable>
              </View>
            )}
            {!selectedDate && (
              <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing.lg }]}>Kommende Termine</Text>
            )}
          </View>
        }
        ListEmptyComponent={!isLoading ? <EmptyState title="Keine Termine" description={selectedDate ? 'Keine Termine an diesem Tag' : 'Keine kommenden Termine'} /> : null}
      />

      {/* Trainer Overview Modal */}
      <TrainerOverviewModal visible={trainerModalVisible} onClose={() => setTrainerModalVisible(false)} />
    </SafeAreaView>
  );
}

/* ─── AgendaItem ──────────────────────────────────────────────────── */

interface AgendaItemProps {
  event: CalendarEvent;
  isTrainer: boolean;
  onShowTrainerOverview: () => void;
}

function AgendaItem({ event, isTrainer, onShowTrainerOverview }: AgendaItemProps) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const router = useRouter();
  const setTrainingAttendance = useSetTrainingAttendance(event.id);
  const [myAttendance, setMyAttendance] = useState<'AVAILABLE' | 'NOT_AVAILABLE' | null>(null);

  const isTraining = event.type === 'TRAINING';
  const hoursUntil = differenceInHours(new Date(event.startDate), new Date());
  const deadlineExpired = isTraining && hoursUntil >= 0 && hoursUntil < 5;

  const handleAttendance = (status: 'AVAILABLE' | 'NOT_AVAILABLE') => {
    if (deadlineExpired) return;
    const newStatus = myAttendance === status ? null : status;
    setMyAttendance(newStatus);
    if (newStatus) {
      setTrainingAttendance.mutate(newStatus === 'AVAILABLE');
    }
  };

  return (
    <Pressable
      onPress={() => router.push(`/match/${event.id}` as never)}
      style={({ pressed }) => [
        { backgroundColor: colors.cardBackground, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.md, marginHorizontal: spacing.xl, opacity: pressed ? 0.9 : 1, ...shadows.sm },
      ]}
    >
      <View style={styles.eventRow}>
        <View style={[styles.eventIcon, { backgroundColor: colors.surface, borderRadius: borderRadius.lg }]}>
          <Ionicons name={EVENT_ICONS[event.type] ?? 'calendar'} size={20} color={colors.textPrimary} />
        </View>
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

      {isTraining && (
        <View style={{ marginTop: spacing.md, marginLeft: 56 }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Pressable
              onPress={() => handleAttendance('AVAILABLE')}
              disabled={deadlineExpired}
              style={[styles.attendBtn, {
                backgroundColor: myAttendance === 'AVAILABLE' ? colors.success : colors.successSurface,
                borderRadius: 12,
                opacity: deadlineExpired ? 0.5 : 1,
              }]}
            >
              <Text style={[typography.buttonSmall, { color: myAttendance === 'AVAILABLE' ? '#FFFFFF' : colors.success }]}>Ja</Text>
            </Pressable>
            <Pressable
              onPress={() => handleAttendance('NOT_AVAILABLE')}
              disabled={deadlineExpired}
              style={[styles.attendBtn, {
                backgroundColor: myAttendance === 'NOT_AVAILABLE' ? colors.danger : colors.dangerSurface,
                borderRadius: 12,
                opacity: deadlineExpired ? 0.5 : 1,
              }]}
            >
              <Text style={[typography.buttonSmall, { color: myAttendance === 'NOT_AVAILABLE' ? '#FFFFFF' : colors.danger }]}>Nein</Text>
            </Pressable>
          </View>
          {deadlineExpired && (
            <Text style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.xs }]}>Anmeldefrist abgelaufen</Text>
          )}
          {isTrainer && (
            <Pressable onPress={onShowTrainerOverview} style={{ marginTop: spacing.sm }}>
              <Text style={[typography.bodySmall, { color: colors.accentLight }]}>Uebersicht</Text>
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}

/* ─── TrainerOverviewModal ────────────────────────────────────────── */

interface OverviewEntry {
  user: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  attending: boolean;
}

interface TrainerOverviewData {
  total: number;
  attending: number;
  notAttending: number;
  entries: OverviewEntry[];
}

function TrainerOverviewModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { data } = useTrainerOverview();
  const overview = (data ?? { total: 0, attending: 0, notAttending: 0, entries: [] }) as TrainerOverviewData;

  return (
    <Modal visible={visible} presentationStyle="pageSheet" animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.xl }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>Trainer-Uebersicht</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: 0 }}>
          <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xxl }}>
            <View style={[styles.summaryBadge, { backgroundColor: colors.successSurface, borderRadius: borderRadius.xl }]}>
              <Text style={[typography.h3, { color: colors.success }]}>{overview.attending}</Text>
              <Text style={[typography.caption, { color: colors.success }]}>Zusagen</Text>
            </View>
            <View style={[styles.summaryBadge, { backgroundColor: colors.dangerSurface, borderRadius: borderRadius.xl }]}>
              <Text style={[typography.h3, { color: colors.danger }]}>{overview.notAttending}</Text>
              <Text style={[typography.caption, { color: colors.danger }]}>Absagen</Text>
            </View>
            <View style={[styles.summaryBadge, { backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.xl }]}>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>{overview.total}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>Gesamt</Text>
            </View>
          </View>
          {overview.entries.map(entry => (
            <View key={entry.user.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm }}>
              <Avatar firstName={entry.user.firstName} lastName={entry.user.lastName} imageUrl={entry.user.avatarUrl} size="sm" />
              <Text style={[typography.bodySmall, { color: colors.textPrimary, flex: 1, marginLeft: spacing.md }]}>
                {entry.user.firstName} {entry.user.lastName}
              </Text>
              <Badge label={entry.attending ? 'Ja' : 'Nein'} variant={entry.attending ? 'success' : 'danger'} />
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  eventRow: { flexDirection: 'row', alignItems: 'center' },
  eventIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 10, paddingVertical: 4 },
  attendBtn: { height: 48, flex: 1, alignItems: 'center', justifyContent: 'center' },
  summaryBadge: { flex: 1, alignItems: 'center', padding: 16 },
});
