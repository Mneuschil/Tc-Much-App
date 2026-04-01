import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui';
import { useTheme } from '../../src/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[typography.h1, { color: colors.accent, textAlign: 'center' }]}>
          Tennis Club
        </Text>
        <Text
          style={[
            typography.body,
            { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
          ]}
        >
          Dein Verein. Eine App.
        </Text>
      </View>
      <View style={[styles.buttons, { gap: spacing.md }]}>
        <Button
          title="Anmelden"
          onPress={() => router.push('/(auth)/login')}
          fullWidth
        />
        <Button
          title="Registrieren"
          onPress={() => router.push('/(auth)/register')}
          variant="outline"
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttons: {
    paddingBottom: 32,
  },
});
