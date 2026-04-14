import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

export function DamageSuccessCard() {
  const { colors, typography, spacing, radii } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.successSurface, borderRadius: radii.md, padding: spacing.xxl },
      ]}
    >
      <Ionicons name="checkmark-circle" size={48} color={colors.success} />
      <Text
        style={[
          typography.h3,
          { color: colors.textPrimary, marginTop: spacing.md, textAlign: 'center' },
        ]}
      >
        Meldung eingereicht
      </Text>
      <Text
        style={[
          typography.caption,
          { color: colors.textSecondary, marginTop: spacing.s, textAlign: 'center' },
        ]}
      >
        Du wirst über den Status informiert
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
});
