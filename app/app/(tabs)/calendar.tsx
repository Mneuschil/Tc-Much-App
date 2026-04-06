import { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, type DateData } from 'react-native-calendars';
import type { MarkedDates } from 'react-native-calendars/src/types';
import { useTheme } from '../../src/theme';
import { EmptyState, QueryError } from '../../src/components/ui';
import { usePermissions } from '../../src/hooks/usePermissions';
import { useEvents } from '../../src/features/calendar/hooks/useEvents';
import { formatDate } from '../../src/utils/formatDate';
import { AgendaItem } from '../../src/components/calendar/AgendaItem';
import { TrainerOverviewModal } from '../../src/components/calendar/TrainerOverviewModal';

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

function getDotColor(
  type: string,
  colors: { danger: string; accent: string; accentLight: string; textSecondary: string },
): string {
  if (type === 'LEAGUE_MATCH' || type === 'CUP_MATCH') return colors.danger;
  if (type === 'TOURNAMENT' || type === 'CLUB_CHAMPIONSHIP' || type === 'RANKING_MATCH')
    return colors.accent;
  if (type === 'CLUB_EVENT') return colors.accentLight;
  if (type === 'TRAINING') return colors.textSecondary;
  return colors.textSecondary;
}

function toDateKey(dateStr: string): string {
  return new Date(dateStr).toISOString().slice(0, 10);
}

export default function CalendarScreen() {
  const { colors, typography, spacing } = useTheme();
  const { isTrainer } = usePermissions();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [trainerModalVisible, setTrainerModalVisible] = useState(false);

  const { data, isLoading, isError, refetch } = useEvents();
  const apiEvents = (data ?? []) as CalendarEvent[];
  const allEvents: CalendarEvent[] = apiEvents;

  const markedDates = useMemo<MarkedDates>(() => {
    const marks: MarkedDates = {};
    for (const event of allEvents) {
      const key = toDateKey(event.startDate);
      const dot = { key: event.id, color: getDotColor(event.type, colors) };
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm }}
      >
        <Text style={[typography.h1, { color: colors.textPrimary }]}>Kalender</Text>
      </View>
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AgendaItem
            event={item}
            isTrainer={isTrainer}
            onShowTrainerOverview={() => setTrainerModalVisible(true)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />
        }
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

      {/* Trainer Overview Modal */}
      <TrainerOverviewModal
        visible={trainerModalVisible}
        onClose={() => setTrainerModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
