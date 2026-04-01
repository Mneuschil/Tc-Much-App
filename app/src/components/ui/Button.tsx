import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, Animated, type ViewStyle, type TextStyle } from 'react-native';
import { useTheme } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'destructive' | 'outline' | 'ghost' | 'dark';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({ title, onPress, variant = 'primary', disabled = false, loading = false, fullWidth = false }: ButtonProps) {
  const { colors, radii } = useTheme();
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
    primary: {
      container: { backgroundColor: colors.buttonPrimary },
      text: { color: colors.buttonPrimaryText },
    },
    secondary: {
      container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#D1D1D6' },
      text: { color: colors.textPrimary },
    },
    accent: {
      container: { backgroundColor: colors.accent },
      text: { color: '#FFFFFF' },
    },
    destructive: {
      container: { backgroundColor: colors.danger },
      text: { color: '#FFFFFF' },
    },
    outline: {
      container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#D1D1D6' },
      text: { color: colors.textPrimary },
    },
    ghost: {
      container: { backgroundColor: 'transparent' },
      text: { color: colors.accentLight },
    },
    dark: {
      container: { backgroundColor: colors.accent },
      text: { color: '#FFFFFF' },
    },
  };

  const isDisabled = disabled || loading;
  const vs = variantStyles[variant];

  return (
    <Animated.View style={{ transform: [{ scale }], width: fullWidth ? '100%' : undefined }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          styles.base,
          { borderRadius: radii.md },
          vs.container,
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={vs.text.color as string} size="small" />
        ) : (
          <Text style={[styles.text, vs.text]}>{title}</Text>
        )}
      </Pressable>
    </Animated.View>
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
  text: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
});
