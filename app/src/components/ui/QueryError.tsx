import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface QueryErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function QueryError({ message, onRetry }: QueryErrorProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={48} color={colors.textTertiary} />
      <Text
        style={[
          typography.h4,
          { color: colors.textPrimary, marginTop: spacing.lg, textAlign: 'center' },
        ]}
      >
        Fehler beim Laden
      </Text>
      <Text
        style={[
          typography.body,
          { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
        ]}
      >
        {message ?? 'Daten konnten nicht geladen werden. Bitte versuche es erneut.'}
      </Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          accessibilityLabel="Erneut versuchen"
          accessibilityRole="button"
          style={[
            styles.retryButton,
            {
              backgroundColor: colors.backgroundSecondary,
              borderRadius: borderRadius.lg,
              marginTop: spacing.xl,
            },
          ]}
        >
          <Ionicons name="refresh" size={18} color={colors.textPrimary} />
          <Text
            style={[typography.bodyMedium, { color: colors.textPrimary, marginLeft: spacing.sm }]}
          >
            Erneut versuchen
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
});
