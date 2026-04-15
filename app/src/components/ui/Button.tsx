import React from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '../../theme';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'destructive'
  | 'outline'
  | 'ghost'
  | 'dark';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
}: ButtonProps) {
  const { colors, radii } = useTheme();

  const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
    primary: {
      container: { backgroundColor: colors.buttonPrimary },
      text: { color: colors.buttonPrimaryText },
    },
    secondary: {
      container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border },
      text: { color: colors.textPrimary },
    },
    accent: {
      container: { backgroundColor: colors.accent },
      text: { color: colors.textInverse },
    },
    destructive: {
      container: { backgroundColor: colors.danger },
      text: { color: colors.textInverse },
    },
    outline: {
      container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border },
      text: { color: colors.textPrimary },
    },
    ghost: {
      container: { backgroundColor: 'transparent' },
      text: { color: colors.accentLight },
    },
    dark: {
      container: { backgroundColor: colors.accent },
      text: { color: colors.textInverse },
    },
  };

  const isDisabled = disabled || loading;
  const vs = variantStyles[variant];

  return (
    <View style={fullWidth ? styles.fullWidth : undefined}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        accessibilityLabel={title}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={({ pressed }) => [
          styles.base,
          { borderRadius: radii.md },
          vs.container,
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={vs.text.color as string} size="small" />
        ) : (
          <Text style={[styles.text, vs.text]}>{title}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 24,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
  text: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
});
