import { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, type DateData } from 'react-native-calendars';
import type { MarkedDates } from 'react-native-calendars/src/types';
import { Ionicons } from '@expo/vector-icons';
import { differenceInHours } from 'date-fns';
import { useTheme } from '../../src/theme';
import { Badge, EmptyState } from '../../src/components/ui';
import { useEvents } from '../../src/features/calendar/hooks/useEvents';
import { useSetTrainingAttendance } from '../../src/features/training/hooks/useTraining';
import { formatDate, formatTime } from '../../src/utils/formatDate';
import { MOCK_EVENTS } from '../../src/lib/mockData';

const EVENT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  LEAGUE_MATCH: 'tennisball', CUP_MATCH: 'trophy', CLUB_CHAMPIONSHIP: 'medal',
  RANKING_MATCH: 'stats-chart', TRAINING: 'fitness', CLUB_EVENT: 'people', TOURNAMENT: 'trophy-outline',
};

type RsvpStatus = 'AVAILABLE' | 'NOT_AVAILABLE' | null;

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
  const { colors, typography, spacing, borderRadius, shadows, radii } = useTheme();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [rsvpMap, setRsvpMap] = useState<Record<string, RsvpStatus>>({});

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

  const handleRsvp = useCallback((eventId: string, status: RsvpStatus) => {
    setRsvpMap(prev => ({ ...prev, [eventId]: prev[eventId] === status ? null : status }));
  }, []);

  const renderEvent = useCallback(({ item }: { item: CalendarEvent }) => {
    const isTraining = item.type === 'TRAINING';
    const hoursUntil = differenceInHours(new Date(item.startDate), new Date());
    const deadlineSoon = isTraining && hoursUntil >= 0 && hoursUntil < 5;
    const currentRsvp = rsvpMap[item.id] ?? null;

    return (
      <Pressable
        onPress={() => router.push(`/match/${item.id}` as never)}
        style={({ pressed }) => [
          { backgroundColor: colors.cardBackground, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.md, opacity: pressed ? 0.9 : 1, ...shadows.sm },
        ]}
      >
        <View style={styles.eventRow}>
          <View style={[styles.eventIcon, { backgroundColor: colors.surface, borderRadius: borderRadius.lg }]}>
            <Ionicons name={EVENT_ICONS[item.type] ?? 'calendar'} size={20} color={colors.textPrimary} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={[typography.bodyMedium, { color: colors.textPrimary }]} numberOfLines={1}>{item.title}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              {formatDate(item.startDate)} · {formatTime(item.startDate)}
            </Text>
          </View>
          {item.isHomeGame !== null && item.isHomeGame !== undefined && (
            <View style={[styles.chip, { backgroundColor: item.isHomeGame ? colors.chipActive : colors.chipInactive, borderRadius: borderRadius.full }]}>
              <Text style={[typography.captionMedium, { color: item.isHomeGame ? colors.textInverse : colors.textSecondary }]}>
                {item.isHomeGame ? 'Heim' : 'Ausw.'}
              </Text>
            </View>
          )}
        </View>

        {deadlineSoon && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, marginLeft: 56 }}>
            <Ionicons name="warning" size={14} color={colors.danger} />
            <Text style={[typography.caption, { color: colors.danger, marginLeft: 4 }]}>
              Anmeldefrist in weniger als 5 Stunden
            </Text>
          </View>
        )}

        {isTraining ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, marginLeft: 56 }}>
            <TrainingAttendancePill
              label="Ja"
              active={currentRsvp === 'AVAILABLE'}
              color={colors.success}
              onPress={() => handleRsvp(item.id, 'AVAILABLE')}
            />
            <TrainingAttendancePill
              label="Nein"
              active={currentRsvp === 'NOT_AVAILABLE'}
              color={colors.danger}
              onPress={() => handleRsvp(item.id, 'NOT_AVAILABLE')}
            />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, marginLeft: 56 }}>
            <RsvpPill label="Zusage" active={currentRsvp === 'AVAILABLE'} color={colors.success} onPress={() => handleRsvp(item.id, 'AVAILABLE')} />
            <RsvpPill label="Absage" active={currentRsvp === 'NOT_AVAILABLE'} color={colors.danger} onPress={() => handleRsvp(item.id, 'NOT_AVAILABLE')} />
          </View>
        )}
      </Pressable>
    );
  }, [colors, typography, spacing, borderRadius, shadows, rsvpMap, handleRsvp, router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm }}>
        <Text style={[typography.h1, { color: colors.textPrimary }]}>Kalender</Text>
      </View>
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
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
                <Text style={[typography.h3, { color: colors.textPrimary }]}>
                  {formatDate(selectedDate)}
                </Text>
                <Pressable onPress={() => setSelectedDate(null)}>
                  <Text style={[typography.bodySmall, { color: colors.accentLight }]}>Alle anzeigen</Text>
                </Pressable>
              </View>
            )}
            {!selectedDate && (
              <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing.lg }]}>
                Kommende Termine
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={!isLoading ? <EmptyState title="Keine Termine" description={selectedDate ? 'Keine Termine an diesem Tag' : 'Keine kommenden Termine'} /> : null}
      />
    </SafeAreaView>
  );
}

interface PillProps {
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
}

function RsvpPill({ label, active, color, onPress }: PillProps) {
  return (
    <Pressable onPress={onPress} style={[styles.rsvpPill, { backgroundColor: active ? color : 'transparent', borderColor: color }]}>
      <Text style={[styles.rsvpPillText, { color: active ? '#FFFFFF' : color }]}>{label}</Text>
    </Pressable>
  );
}

function TrainingAttendancePill({ label, active, color, onPress }: PillProps) {
  return (
    <Pressable onPress={onPress} style={[styles.rsvpPill, { backgroundColor: active ? color : 'transparent', borderColor: color }]}>
      <Text style={[styles.rsvpPillText, { color: active ? '#FFFFFF' : color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  eventRow: { flexDirection: 'row', alignItems: 'center' },
  eventIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 10, paddingVertical: 4 },
  rsvpPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  rsvpPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
