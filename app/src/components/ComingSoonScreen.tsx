import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface ComingSoonScreenProps {
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function ComingSoonScreen({
  title,
  description = 'Diese Funktion wird in einem der nächsten Updates freigeschaltet.',
  icon = 'time-outline',
}: ComingSoonScreenProps) {
  const { colors, spacing, typography, radii } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: colors.accentSurface,
              borderRadius: radii.xl,
              marginBottom: spacing.xl,
            },
          ]}
        >
          <Ionicons name={icon} size={40} color={colors.accent} />
        </View>
        <Text
          style={[
            typography.h1,
            { color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.md },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            typography.body,
            {
              color: colors.textSecondary,
              textAlign: 'center',
              paddingHorizontal: spacing.xxl,
            },
          ]}
        >
          {description}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
