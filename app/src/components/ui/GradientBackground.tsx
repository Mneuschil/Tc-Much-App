import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';

interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: 'subtle' | 'strong';
}

/**
 * Dezenter Vereins-Gradient: sehr hellgrün oben → Hintergrund unten.
 * Wird als Layer hinter den Screen-Inhalt gelegt.
 */
export function GradientBackground({
  children,
  style,
  intensity = 'subtle',
}: GradientBackgroundProps) {
  const { colors, isDark } = useTheme();

  const topColor = isDark
    ? colors.accentSurface
    : intensity === 'subtle'
      ? colors.accentSubtle
      : colors.accentSurface;
  const bottomColor = colors.background;

  return (
    <View style={[styles.wrap, style]}>
      <LinearGradient
        colors={[topColor, bottomColor]}
        locations={[0, 0.55]}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
});
