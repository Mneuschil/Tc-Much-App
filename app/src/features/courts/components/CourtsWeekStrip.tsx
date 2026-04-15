import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import {
  getWeekDays,
  isSameDay,
  toDateKey,
  getCalendarWeek,
  DAY_LABELS_DE,
  MONTH_NAMES_DE,
} from '../../../utils/calendarUtils';
import type { CourtSlot } from '../services/courtsService';
import { getCategoryStyle } from '../utils/courtConstants';

interface CourtsWeekStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  /** Slots der aktuell angezeigten Woche — fuer Punkte unter dem Tag. */
  weekSlots?: CourtSlot[];
}

export function CourtsWeekStrip({
  selectedDate,
  onDateSelect,
  weekSlots = [],
}: CourtsWeekStripProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const today = useMemo(() => new Date(), []);
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  const slotsByDay = useMemo(() => {
    const map = new Map<string, CourtSlot[]>();
    for (const s of weekSlots) {
      const k = toDateKey(new Date(s.startTime));
      const arr = map.get(k);
      if (arr) arr.push(s);
      else map.set(k, [s]);
    }
    return map;
  }, [weekSlots]);

  const goPrevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    onDateSelect(d);
  };
  const goNextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    onDateSelect(d);
  };

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.backgroundSecondary,
          borderRadius: borderRadius.lg,
          paddingHorizontal: spacing.m,
          paddingTop: spacing.s,
          paddingBottom: spacing.m,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Pressable
          onPress={goPrevWeek}
          accessibilityLabel="Vorige Woche"
          accessibilityRole="button"
          hitSlop={8}
          style={styles.arrowBtn}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          KW {getCalendarWeek(selectedDate)} · {MONTH_NAMES_DE[selectedDate.getMonth()]}{' '}
          {selectedDate.getFullYear()}
        </Text>
        <Pressable
          onPress={goNextWeek}
          accessibilityLabel="Naechste Woche"
          accessibilityRole="button"
          hitSlop={8}
          style={styles.arrowBtn}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);
          const key = toDateKey(day);
          const daySlots = slotsByDay.get(key) ?? [];

          return (
            <Pressable
              key={key}
              onPress={() => onDateSelect(day)}
              style={styles.dayCol}
              accessibilityLabel={`${DAY_LABELS_DE[i]} ${day.getDate()}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.dayLabel,
                  {
                    color: isSelected ? colors.accent : colors.textTertiary,
                  },
                ]}
              >
                {DAY_LABELS_DE[i]}
              </Text>
              <View
                style={[
                  styles.dayCircle,
                  isSelected && { backgroundColor: colors.accent },
                  !isSelected &&
                    isToday && {
                      borderWidth: 1.5,
                      borderColor: colors.accent,
                    },
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    {
                      color: isSelected
                        ? colors.buttonPrimaryText
                        : isToday
                          ? colors.accent
                          : colors.textPrimary,
                      fontWeight: isSelected || isToday ? '700' : '500',
                    },
                  ]}
                >
                  {day.getDate()}
                </Text>
              </View>
              <View style={styles.dotsRow}>
                {daySlots.slice(0, 3).map((s) => {
                  const style = getCategoryStyle(s.category, colors);
                  return (
                    <View key={s.id} style={[styles.dot, { backgroundColor: style.border }]} />
                  );
                })}
                {daySlots.length === 0 && <View style={styles.dotPlaceholder} />}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayCol: {
    alignItems: 'center',
    flex: 1,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 14,
  },
  dotsRow: {
    flexDirection: 'row',
    marginTop: 5,
    gap: 3,
    height: 6,
    alignItems: 'center',
  },
  dot: { width: 4, height: 4, borderRadius: 2 },
  dotPlaceholder: { height: 4 },
});
