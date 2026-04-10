import { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, type DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import type { MarkedDates } from 'react-native-calendars/src/types';
import { useTheme } from '../../src/theme';
import { EmptyState, QueryError } from '../../src/components/ui';
import { usePermissions } from '../../src/hooks/usePermissions';
import { useEvents } from '../../src/features/calendar/hooks/useEvents';
import { formatDate } from '../../src/utils/formatDate';
import { toDateKey, getEventColor, type CalendarEvent } from '../../src/utils/calendarUtils';
import { AgendaItem } from '../../src/components/calendar/AgendaItem';
import { TrainerOverviewModal } from '../../src/components/calendar/TrainerOverviewModal';
import { CreateEventModal } from '../../src/components/calendar/CreateEventModal';

const EVENT_FILTER_OPTIONS: { value: string | null; label: string }[] = [
  { value: 'TRAINING', label: 'Training' },
  { value: 'LEAGUE_MATCH', label: 'Ligaspiele' },
  { value: 'CUP_MATCH', label: 'Pokal' },
  { value: 'CLUB_EVENT', label: 'Vereinsevents' },
  { value: 'TOURNAMENT', label: 'Turniere' },
  { value: 'CLUB_CHAMPIONSHIP', label: 'Clubmeisterschaft' },
  { value: 'RANKING_MATCH', label: 'Rangliste' },
];

export default function CalendarScreen() {
  const { colors, typography, spacing } = useTheme();
  const { isTrainer, isBoard } = usePermissions();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [trainerEventId, setTrainerEventId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useEvents();
  const apiEvents = useMemo(() => (data ?? []) as CalendarEvent[], [data]);
  const allEvents = useMemo(
    () => (activeFilter ? apiEvents.filter((e) => e.type === activeFilter) : apiEvents),
    [apiEvents, activeFilter],
  );

  const markedDates = useMemo<MarkedDates>(() => {
    const marks: MarkedDates = {};
    for (const event of allEvents) {
      const key = toDateKey(event.startDate);
      const dot = { key: event.id, color: getEventColor(event.type, colors) };
      if (marks[key]) {
        const existing = marks[key];
        const dots = existing?.dots ? [...existing.dots, dot] : [dot];
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
  }, [allEvents, selectedDate, colors]);

  const filteredEvents = useMemo(() => {
    if (!selectedDate) {
      const now = new Date();
      return allEvents
        .filter((e) => new Date(e.startDate) >= now)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }
    return allEvents
      .filter((e) => toDateKey(e.startDate) === selectedDate)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [allEvents, selectedDate]);

  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDate((prev) => (prev === day.dateString ? null : day.dateString));
  }, []);

  const renderAgendaItem = useCallback(
    ({ item }: { item: CalendarEvent }) => (
      <AgendaItem
        event={item}
        isTrainer={isTrainer}
        onShowTrainerOverview={() => setTrainerEventId(item.id)}
      />
    ),
    [isTrainer],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm }}
      >
        <Text style={[typography.h1, { color: colors.textPrimary }]}>Kalender</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          gap: spacing.sm,
          paddingBottom: spacing.md,
        }}
      >
        {EVENT_FILTER_OPTIONS.map((opt) => {
          const isActive = activeFilter === opt.value;
          return (
            <Pressable
              key={opt.value ?? 'all'}
              onPress={() => setActiveFilter(isActive ? null : opt.value)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: isActive ? colors.chipActive : colors.backgroundSecondary,
                  borderRadius: 999,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  { color: isActive ? colors.textInverse : colors.textPrimary, fontWeight: '600' },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <FlashList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderAgendaItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />
        }
        ListHeaderComponent={
          <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
            <Calendar
              firstDay={1}
              markingType="multi-dot"
              markedDates={markedDates}
              onDayPress={handleDayPress}
              theme={{
                backgroundColor: colors.background,
                calendarBackground: colors.background,
                todayTextColor: colors.accentLight,
                selectedDayBackgroundColor: colors.accent,
                selectedDayTextColor: colors.textInverse,
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
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: spacing.lg,
                }}
              >
                <Text style={[typography.h3, { color: colors.textPrimary }]}>
                  {formatDate(selectedDate)}
                </Text>
                <Pressable onPress={() => setSelectedDate(null)}>
                  <Text style={[typography.bodySmall, { color: colors.accentLight }]}>
                    Alle anzeigen
                  </Text>
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
        ListEmptyComponent={
          !isLoading ? (
            isError ? (
              <QueryError onRetry={refetch} />
            ) : (
              <EmptyState
                title="Keine Termine"
                description={
                  selectedDate ? 'Keine Termine an diesem Tag' : 'Keine kommenden Termine'
                }
              />
            )
          ) : null
        }
      />

      {/* FAB fuer Board-Members */}
      {isBoard && (
        <Pressable
          onPress={() => setShowCreateModal(true)}
          style={[styles.fab, { backgroundColor: colors.buttonPrimary }]}
        >
          <Ionicons name="add" size={24} color={colors.buttonPrimaryText} />
        </Pressable>
      )}

      {/* Trainer Overview Modal */}
      <TrainerOverviewModal
        visible={trainerEventId !== null}
        eventId={trainerEventId}
        onClose={() => setTrainerEventId(null)}
      />

      {/* Create Event Modal */}
      <CreateEventModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        preselectedDate={selectedDate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 8 },
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
});
