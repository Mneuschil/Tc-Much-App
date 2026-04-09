import { useMemo, type ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme';
import {
  getWeekDays,
  toDateKey,
  isSameDay,
  getCalendarWeek,
  DAY_LABELS_DE,
  MONTH_NAMES_DE,
  getEventColor,
  type CalendarEvent,
} from '../../utils/calendarUtils';

type WeekEvent = Pick<CalendarEvent, 'id' | 'startDate' | 'type'>;

interface WeekCalendarStripProps {
  events: WeekEvent[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  children?: ReactNode;
}

export function WeekCalendarStrip({
  events,
  selectedDate,
  onDateSelect,
  children,
}: WeekCalendarStripProps) {
  const { colors, typography, borderRadius, isDark } = useTheme();
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, WeekEvent[]>();
    for (const event of events) {
      const key = toDateKey(new Date(event.startDate));
      const existing = map.get(key);
      if (existing) {
        existing.push(event);
      } else {
        map.set(key, [event]);
      }
    }
    return map;
  }, [events]);

  const gradientColors: [string, string] = isDark
    ? ['rgba(14, 166, 90, 0.15)', 'rgba(2, 51, 32, 0.25)']
    : ['rgba(209, 242, 236, 0.7)', 'rgba(237, 249, 246, 0.5)'];

  const content = (
    <View style={styles.innerContainer}>
      {/* Month header + KW */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text style={[typography.h3, { color: colors.textPrimary }]}>
            {MONTH_NAMES_DE[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            KW {getCalendarWeek(selectedDate)}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/calendar' as never)}
          style={[
            styles.calendarButton,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
          ]}
        >
          <Ionicons name="calendar" size={18} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Week days */}
      <View style={styles.weekRow}>
        {weekDays.map((day, index) => {
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);
          const dateKey = toDateKey(day);
          const dayEvents = eventsByDate.get(dateKey) ?? [];

          return (
            <Pressable key={dateKey} onPress={() => onDateSelect(day)} style={styles.dayColumn}>
              <Text
                style={[
                  typography.caption,
                  styles.dayLabel,
                  { color: isSelected ? colors.textPrimary : colors.textSecondary },
                ]}
              >
                {DAY_LABELS_DE[index]}
              </Text>
              <View
                style={[
                  styles.dayCircle,
                  isSelected && {
                    backgroundColor: isDark ? colors.accentLight : colors.textPrimary,
                  },
                  isToday && !isSelected && { borderWidth: 1.5, borderColor: colors.accentLight },
                ]}
              >
                <Text
                  style={[
                    typography.bodyMedium,
                    {
                      color: isSelected
                        ? colors.textInverse
                        : isToday
                          ? colors.accentLight
                          : colors.textPrimary,
                    },
                  ]}
                >
                  {day.getDate()}
                </Text>
              </View>
              <View style={styles.dotsRow}>
                {dayEvents.length > 0 ? (
                  dayEvents
                    .slice(0, 3)
                    .map((ev) => (
                      <View
                        key={ev.id}
                        style={[styles.dot, { backgroundColor: getEventColor(ev.type, colors) }]}
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

      {/* Day agenda (children) */}
      {children && (
        <View
          style={[
            styles.agendaSection,
            { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
          ]}
        >
          {children}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { borderRadius: borderRadius.xl }]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius: borderRadius.xl }]}
      >
        {Platform.OS === 'ios' ? (
          <BlurView
            intensity={60}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.blur, { borderRadius: borderRadius.xl }]}
          >
            {content}
          </BlurView>
        ) : (
          <View
            style={[
              styles.androidFallback,
              {
                backgroundColor: isDark ? 'rgba(28, 28, 30, 0.85)' : 'rgba(255, 255, 255, 0.75)',
                borderRadius: borderRadius.xl,
              },
            ]}
          >
            {content}
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  gradient: { overflow: 'hidden' },
  blur: { overflow: 'hidden' },
  androidFallback: { overflow: 'hidden' },
  innerContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around' },
  dayColumn: { alignItems: 'center', flex: 1 },
  dayLabel: { marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: { flexDirection: 'row', marginTop: 6, gap: 3, height: 6, alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  dotPlaceholder: { height: 5 },
  agendaSection: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 14, paddingTop: 4 },
});
