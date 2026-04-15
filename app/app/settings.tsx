import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Switch, Pressable, ScrollView, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../src/theme';
import { FilterPill } from '../src/components/ui/FilterPill';
import { useThemeStore } from '../src/stores/themeStore';

type ThemeOption = 'system' | 'light' | 'dark';

export default function SettingsScreen() {
  const { colors, spacing, typography } = useTheme();
  const { isDarkMode, setDarkMode } = useThemeStore();
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }) => {
      setPushEnabled(status === 'granted');
    });
  }, []);

  const togglePush = useCallback(async () => {
    if (pushEnabled) {
      setPushEnabled(false);
    } else {
      const { status } = await Notifications.requestPermissionsAsync();
      setPushEnabled(status === 'granted');
    }
  }, [pushEnabled]);

  const currentTheme: ThemeOption = isDarkMode ? 'dark' : 'light';

  const handleThemeChange = (option: ThemeOption) => {
    if (option === 'system') {
      setDarkMode(false);
    } else {
      setDarkMode(option === 'dark');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: 100,
        }}
      >
        <Text
          accessibilityRole="header"
          style={[typography.h1, { color: colors.textPrimary, marginBottom: spacing.xxl }]}
        >
          Einstellungen
        </Text>

        {/* Benachrichtigungen */}
        <Text
          accessibilityRole="header"
          style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.md }]}
        >
          Benachrichtigungen
        </Text>
        <View
          style={[
            styles.settingRow,
            {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.separator,
              paddingBottom: spacing.lg,
              marginBottom: spacing.xxl,
            },
          ]}
        >
          <Text style={[typography.bodyMedium, { color: colors.textPrimary, flex: 1 }]}>
            Push-Benachrichtigungen
          </Text>
          <Switch
            value={pushEnabled}
            onValueChange={togglePush}
            trackColor={{ true: colors.accent, false: colors.backgroundTertiary }}
          />
        </View>

        {/* Darstellung */}
        <Text
          accessibilityRole="header"
          style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.md }]}
        >
          Darstellung
        </Text>
        <View style={[styles.themeRow, { marginBottom: spacing.xxl }]}>
          <FilterPill label="System" isActive={false} onPress={() => handleThemeChange('system')} />
          <FilterPill
            label="Hell"
            isActive={currentTheme === 'light'}
            onPress={() => handleThemeChange('light')}
          />
          <FilterPill
            label="Dunkel"
            isActive={currentTheme === 'dark'}
            onPress={() => handleThemeChange('dark')}
          />
        </View>

        {/* App Info */}
        <Text
          accessibilityRole="header"
          style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.md }]}
        >
          App
        </Text>

        <View
          style={[
            styles.settingRow,
            {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.separator,
              paddingVertical: spacing.lg,
            },
          ]}
        >
          <Text style={[typography.bodyMedium, { color: colors.textPrimary, flex: 1 }]}>
            Version
          </Text>
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>1.0.0</Text>
        </View>

        <Pressable
          onPress={() => Linking.openURL('https://example.com/datenschutz')}
          style={({ pressed }) => [
            styles.settingRow,
            {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.separator,
              paddingVertical: spacing.lg,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text style={[typography.bodyMedium, { color: colors.textPrimary, flex: 1 }]}>
            Datenschutz
          </Text>
          <Ionicons name="open-outline" size={18} color={colors.textTertiary} />
        </Pressable>

        <Pressable
          onPress={() => Linking.openURL('https://example.com/impressum')}
          style={({ pressed }) => [
            styles.settingRow,
            { paddingVertical: spacing.lg, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[typography.bodyMedium, { color: colors.textPrimary, flex: 1 }]}>
            Impressum
          </Text>
          <Ionicons name="open-outline" size={18} color={colors.textTertiary} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  settingRow: { flexDirection: 'row', alignItems: 'center' },
  themeRow: { flexDirection: 'row', gap: 8 },
});
