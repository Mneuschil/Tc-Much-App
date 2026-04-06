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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme';
import { Button } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clubCode, setClubCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password.trim() ||
      !clubCode.trim()
    ) {
      Alert.alert('Fehler', 'Bitte alle Felder ausfuellen');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Fehler', 'Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }

    setLoading(true);
    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        clubCode: clubCode.trim().toUpperCase(),
      });
      router.replace('/(tabs)/home');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      const message = axiosErr?.response?.data?.error?.message || 'Registrierung fehlgeschlagen';
      Alert.alert('Fehler', message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      color: colors.textPrimary,
      padding: spacing.md,
      marginBottom: spacing.lg,
      fontSize: typography.body.fontSize,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: spacing.xxl }]}>
            Registrieren
          </Text>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text
                style={[
                  typography.bodySmall,
                  { color: colors.textSecondary, marginBottom: spacing.xs },
                ]}
              >
                Vorname
              </Text>
              <TextInput
                style={inputStyle}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Max"
                placeholderTextColor={colors.textSecondary}
                autoCorrect={false}
              />
            </View>
            <View style={[styles.halfField, { marginLeft: spacing.md }]}>
              <Text
                style={[
                  typography.bodySmall,
                  { color: colors.textSecondary, marginBottom: spacing.xs },
                ]}
              >
                Nachname
              </Text>
              <TextInput
                style={inputStyle}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Mustermann"
                placeholderTextColor={colors.textSecondary}
                autoCorrect={false}
              />
            </View>
          </View>

          <Text
            style={[
              typography.bodySmall,
              { color: colors.textSecondary, marginBottom: spacing.xs },
            ]}
          >
            E-Mail
          </Text>
          <TextInput
            style={inputStyle}
            value={email}
            onChangeText={setEmail}
            placeholder="deine@email.de"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text
            style={[
              typography.bodySmall,
              { color: colors.textSecondary, marginBottom: spacing.xs },
            ]}
          >
            Passwort
          </Text>
          <TextInput
            style={inputStyle}
            value={password}
            onChangeText={setPassword}
            placeholder="Mind. 8 Zeichen"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
          />

          <Text
            style={[
              typography.bodySmall,
              { color: colors.textSecondary, marginBottom: spacing.xs },
            ]}
          >
            Club-Code
          </Text>
          <TextInput
            style={inputStyle}
            value={clubCode}
            onChangeText={setClubCode}
            placeholder="z.B. TCM026"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <Button title="Registrieren" onPress={handleRegister} loading={loading} fullWidth />

          <View style={[styles.footer, { marginTop: spacing.xl }]}>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
              Bereits registriert?{' '}
            </Text>
            <Text
              style={[typography.bodySmall, { color: colors.accent, fontWeight: '600' }]}
              onPress={() => router.push('/(auth)/login')}
            >
              Anmelden
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
  row: { flexDirection: 'row' },
  halfField: { flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center' },
});
