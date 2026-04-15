import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';

interface DateNavigatorProps {
  date: Date;
  onChange: (next: Date) => void;
}

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDate(date: Date) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, today)) return 'Heute';
  if (isSameDay(date, tomorrow)) return 'Morgen';
  if (isSameDay(date, yesterday)) return 'Gestern';
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()}. ${date.toLocaleDateString('de-DE', { month: 'long' })}`;
}

export function DateNavigator({ date, onChange }: DateNavigatorProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const goPrev = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    onChange(d);
  };
  const goNext = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    onChange(d);
  };
  const goToday = () => onChange(new Date());

  const isToday = isSameDay(date, new Date());

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundSecondary,
          borderRadius: borderRadius.lg,
          paddingHorizontal: spacing.m,
          paddingVertical: spacing.s,
        },
      ]}
    >
      <Pressable
        onPress={goPrev}
        accessibilityLabel="Vorheriger Tag"
        accessibilityRole="button"
        style={styles.iconButton}
        hitSlop={8}
      >
        <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
      </Pressable>

      <Pressable
        onPress={goToday}
        accessibilityLabel="Zu heute springen"
        accessibilityRole="button"
        style={styles.label}
      >
        <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
          {formatDate(date)}
        </Text>
        {!isToday && (
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
            Tippen für heute
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={goNext}
        accessibilityLabel="Nächster Tag"
        accessibilityRole="button"
        style={styles.iconButton}
        hitSlop={8}
      >
        <Ionicons name="chevron-forward" size={22} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    alignItems: 'center',
  },
});
