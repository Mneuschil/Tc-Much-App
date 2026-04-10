import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
}

export function SearchInput({ placeholder = 'Suchen...', value, onChangeText }: SearchInputProps) {
  const { colors, radii, spacing } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundSecondary,
          borderRadius: radii.pill,
          paddingHorizontal: spacing.xl,
        },
      ]}
    >
      <Ionicons name="search" size={18} color={colors.textTertiary} style={styles.icon} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel={placeholder}
        accessibilityRole="search"
        style={[styles.input, { color: colors.textPrimary }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: 48,
  },
});
