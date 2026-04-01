import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'accent' | 'neutral' | 'dark' | 'info' | 'mint';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export function Badge({ label, variant = 'neutral', size = 'md' }: BadgeProps) {
  const { colors, radii, spacing } = useTheme();

  const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
    success: { bg: colors.successSurface, text: colors.success },
    danger: { bg: colors.dangerSurface, text: colors.danger },
    warning: { bg: colors.warningSurface, text: colors.warning },
    accent: { bg: colors.accentSubtle, text: colors.accent },
    neutral: { bg: colors.backgroundSecondary, text: colors.textSecondary },
    dark: { bg: colors.buttonPrimary, text: colors.buttonPrimaryText },
    info: { bg: colors.accentSubtle, text: colors.info },
    mint: { bg: colors.accentSurface, text: colors.accent },
  };

  const { bg, text } = variantColors[variant];
  const isSmall = size === 'sm';

  return (
    <View style={[
      styles.badge,
      {
        backgroundColor: bg,
        borderRadius: radii.pill,
        paddingHorizontal: isSmall ? spacing.s : spacing.m,
        paddingVertical: isSmall ? 2 : spacing.xs,
      },
    ]}>
      <Text style={[{ color: text, fontSize: isSmall ? 11 : 12, fontWeight: '600' }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start' },
});
