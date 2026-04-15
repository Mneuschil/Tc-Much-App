import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';

export function BookingComingSoonBanner() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.accentSubtle,
          borderRadius: borderRadius.lg,
          padding: spacing.l,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel="Buchung folgt bald"
    >
      <Ionicons name="time-outline" size={20} color={colors.accent} />
      <View style={[styles.textWrap, { marginLeft: spacing.m }]}>
        <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
          Buchung folgt bald
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
          Aktuell siehst du nur die Belegung. Plätze online buchen kommt mit einem späteren Update.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  textWrap: {
    flex: 1,
  },
});
