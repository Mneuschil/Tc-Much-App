import React, { type ReactNode } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({ children, style, padded = true, variant = 'default' }: CardProps) {
  const { colors, radii, spacing, shadows } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderRadius: radii.lg }, padded && { padding: spacing.l }, variant === 'elevated' && shadows.md, variant === 'outlined' && { borderWidth: 1, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
});
