import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface InputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  error?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  nativeID?: string;
  accessibilityLabelledBy?: string;
}

export function Input({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  error,
  accessibilityLabel,
  accessibilityHint,
  nativeID,
  accessibilityLabelledBy,
}: InputProps) {
  const { colors, radii, spacing } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        accessibilityLabel={accessibilityLabel ?? placeholder}
        accessibilityHint={accessibilityHint}
        nativeID={nativeID}
        accessibilityLabelledBy={accessibilityLabelledBy}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          {
            backgroundColor: colors.backgroundSecondary,
            borderRadius: radii.md,
            color: colors.textPrimary,
            paddingHorizontal: spacing.l,
          },
          focused && { borderWidth: 1.5, borderColor: colors.accent },
          error ? { borderWidth: 1.5, borderColor: colors.danger } : null,
        ]}
      />
      {error ? (
        <View accessibilityLiveRegion="polite">
          <Text
            accessibilityRole="alert"
            style={[styles.error, { color: colors.danger, marginTop: spacing.xs }]}
          >
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 48,
    fontSize: 15,
    borderWidth: 0,
  },
  error: {
    fontSize: 13,
  },
});
