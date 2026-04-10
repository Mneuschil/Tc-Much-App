import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  AccessibilityInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme';
import { Button } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Fehler', 'Bitte E-Mail und Passwort eingeben');
      return;
    }

    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
      AccessibilityInfo.announceForAccessibility('Erfolgreich angemeldet');
      router.replace('/(tabs)/home');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      const message = axiosErr?.response?.data?.error?.message || 'Anmeldung fehlgeschlagen';
      Alert.alert('Fehler', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: spacing.xxl }]}>
            Anmelden
          </Text>

          <Text
            nativeID="login-email-label"
            style={[
              typography.bodySmall,
              { color: colors.textSecondary, marginBottom: spacing.xs },
            ]}
          >
            E-Mail
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.backgroundSecondary,
                borderRadius: borderRadius.md,
                color: colors.textPrimary,
                padding: spacing.md,
                marginBottom: spacing.lg,
                fontSize: typography.body.fontSize,
              },
            ]}
            value={email}
            onChangeText={setEmail}
            placeholder="deine@email.de"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="E-Mail-Adresse"
            accessibilityLabelledBy="login-email-label"
          />

          <Text
            nativeID="login-password-label"
            style={[
              typography.bodySmall,
              { color: colors.textSecondary, marginBottom: spacing.xs },
            ]}
          >
            Passwort
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.backgroundSecondary,
                borderRadius: borderRadius.md,
                color: colors.textPrimary,
                padding: spacing.md,
                marginBottom: spacing.xxl,
                fontSize: typography.body.fontSize,
              },
            ]}
            value={password}
            onChangeText={setPassword}
            placeholder="Passwort"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            accessibilityLabel="Passwort"
            accessibilityLabelledBy="login-password-label"
          />

          <Button title="Anmelden" onPress={handleLogin} loading={loading} fullWidth />

          <View style={[styles.footer, { marginTop: spacing.xl }]}>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
              Noch kein Konto?{' '}
            </Text>
            <Text
              style={[typography.bodySmall, { color: colors.accent, fontWeight: '600' }]}
              onPress={() => router.push('/(auth)/register')}
              accessibilityRole="link"
              accessibilityLabel="Registrieren"
            >
              Registrieren
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  input: { height: 48 },
  footer: { flexDirection: 'row', justifyContent: 'center' },
});
