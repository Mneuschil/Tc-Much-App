import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  getWeekDays,
  toDateKey,
  isSameDay,
  getCalendarWeek,
  DAY_LABELS_DE,
  MONTH_NAMES_DE,
  type CalendarEvent,
} from '../../utils/calendarUtils';

type WeekEvent = Pick<CalendarEvent, 'id' | 'startDate' | 'type'>;

const HERO_DOT_COLORS: Record<string, string> = {
  LEAGUE_MATCH: '#FF453A',
  CUP_MATCH: '#FF453A',
  RANKING_MATCH: '#FF9500',
  TOURNAMENT: '#0EA65A',
  CLUB_CHAMPIONSHIP: '#0EA65A',
  TRAINING: '#34D058',
  CLUB_EVENT: 'rgba(255,255,255,0.7)',
};

function dotColor(type: string): string {
  return HERO_DOT_COLORS[type] ?? 'rgba(255,255,255,0.5)';
}

interface WeekDayStripProps {
  events: WeekEvent[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export function WeekDayStrip({ events, selectedDate, onDateSelect }: WeekDayStripProps) {
  const today = useMemo(() => new Date(), []);
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const isToday = isSameDay(selectedDate, today);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, WeekEvent[]>();
    for (const ev of events) {
      const k = toDateKey(new Date(ev.startDate));
      const arr = map.get(k);
      if (arr) arr.push(ev);
      else map.set(k, [ev]);
    }
    return map;
  }, [events]);

  return (
    <View style={styles.section}>
      <View style={styles.metaRow}>
        <Text style={styles.todayLabel}>{isToday ? 'Heute' : ''}</Text>
        <Text style={styles.monthLabel}>
          KW {getCalendarWeek(selectedDate)} · {MONTH_NAMES_DE[selectedDate.getMonth()]}{' '}
          {selectedDate.getFullYear()}
        </Text>
      </View>

      <View style={styles.weekRow}>
        {weekDays.map((day, index) => {
          const isTodayDay = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);
          const key = toDateKey(day);
          const dayEvts = eventsByDate.get(key) ?? [];

          return (
            <Pressable
              key={key}
              onPress={() => onDateSelect(day)}
              style={styles.dayCol}
              accessibilityLabel={`${DAY_LABELS_DE[index]} ${day.getDate()}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={[styles.dayLabel, isSelected && styles.dayLabelActive]}>
                {DAY_LABELS_DE[index]}
              </Text>
              <View
                style={[
                  styles.dayCircle,
                  isSelected && styles.dayCircleActive,
                  isTodayDay && !isSelected && styles.dayCircleToday,
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    isSelected && styles.dayNumberActive,
                    isTodayDay && !isSelected && styles.dayNumberToday,
                  ]}
                >
                  {day.getDate()}
                </Text>
              </View>
              <View
                style={styles.dotsRow}
                importantForAccessibility="no"
                accessibilityElementsHidden
              >
                {dayEvts.length > 0 ? (
                  dayEvts
                    .slice(0, 3)
                    .map((ev) => (
                      <View
                        key={ev.id}
                        style={[styles.dot, { backgroundColor: dotColor(ev.type) }]}
                      />
                    ))
                ) : (
                  <View style={styles.dotPlaceholder} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingTop: 14, paddingBottom: 16 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  todayLabel: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  monthLabel: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.55)' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around' },
  dayCol: { alignItems: 'center', flex: 1 },
  dayLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayLabelActive: { color: '#fff' },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: { backgroundColor: 'rgba(255,255,255,0.95)' },
  dayCircleToday: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)' },
  dayNumber: { fontSize: 15, fontWeight: '500', color: 'rgba(255,255,255,0.6)' },
  dayNumberActive: { color: '#023320', fontWeight: '700' },
  dayNumberToday: { color: '#fff' },
  dotsRow: { flexDirection: 'row', marginTop: 6, gap: 3, height: 6, alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  dotPlaceholder: { height: 5 },
});
