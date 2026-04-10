import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface FilterPillProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

export function FilterPill({ label, isActive, onPress }: FilterPillProps) {
  const { colors, radii, spacing } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      style={[
        styles.pill,
        {
          borderRadius: radii.pill,
          paddingHorizontal: spacing.l,
          backgroundColor: isActive ? colors.buttonPrimary : colors.backgroundSecondary,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: isActive ? colors.buttonPrimaryText : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
