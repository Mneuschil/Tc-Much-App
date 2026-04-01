import React, { type ReactNode } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

interface CardElevatedProps {
  children: ReactNode;
  style?: ViewStyle;
}

export function CardElevated({ children, style }: CardElevatedProps) {
  const { colors, radii, spacing, shadows } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.background, borderRadius: radii.lg, padding: spacing.l }, shadows.md, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
});
