import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme';
import { EmptyState } from '../../src/components/ui';

export default function TournamentsScreen() {
  const { colors, typography, spacing } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.lg }]}>
        <Text style={[typography.h2, { color: colors.textPrimary }]}>Turniere</Text>
      </View>
      <EmptyState
        title="Keine Turniere"
        description="Laufende und kommende Turniere erscheinen hier"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {},
});
