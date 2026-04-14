import { View, Text, StyleSheet, Pressable, Appearance } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lightColors, darkColors } from '../theme/colors';

interface ScreenErrorBoundaryProps {
  error: Error;
  retry: () => void;
}

/**
 * Expo Router ErrorBoundary – als Named Export in Screens verwenden:
 * export { ScreenErrorBoundary as ErrorBoundary } from '../src/components/ScreenErrorBoundary';
 */
export function ScreenErrorBoundary({ error, retry }: ScreenErrorBoundaryProps) {
  const isDark = Appearance.getColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.dangerSurface }]}>
        <Ionicons name="warning-outline" size={32} color={colors.danger} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Etwas ist schiefgelaufen</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {error.message || 'Ein unerwarteter Fehler ist aufgetreten.'}
      </Text>
      <Pressable
        style={[styles.button, { backgroundColor: colors.buttonPrimary }]}
        onPress={retry}
        accessibilityLabel="Erneut versuchen"
        accessibilityRole="button"
      >
        <Text style={[styles.buttonText, { color: colors.buttonPrimaryText }]}>
          Erneut versuchen
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    maxWidth: 300,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 180,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
