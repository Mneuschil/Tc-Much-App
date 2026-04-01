import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/theme';
import { EmptyState } from '../src/components/ui/EmptyState';
import { CourtDamageForm } from '../src/components/forms/CourtDamageForm';
import { MediaUploadForm } from '../src/components/forms/MediaUploadForm';
import { ReportCard } from '../src/components/forms/ReportCard';
import { useMyReports } from '../src/hooks/useForms';
import type { FormSubmission } from '@tennis-club/shared';

type ActiveView = 'menu' | 'court-damage' | 'media-upload';

export default function FormsScreen() {
  const { colors, spacing, radii, typography } = useTheme();
  const [activeView, setActiveView] = useState<ActiveView>('menu');
  const { data: reports, isLoading, refetch } = useMyReports();

  if (activeView === 'court-damage') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerRow, { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md }]}>
          <Pressable onPress={() => setActiveView('menu')} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={[typography.h2, { color: colors.textPrimary, marginLeft: spacing.md }]}>Platzschaden melden</Text>
        </View>
        <CourtDamageForm />
      </SafeAreaView>
    );
  }

  if (activeView === 'media-upload') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerRow, { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md }]}>
          <Pressable onPress={() => setActiveView('menu')} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={[typography.h2, { color: colors.textPrimary, marginLeft: spacing.md }]}>Medien hochladen</Text>
        </View>
        <MediaUploadForm />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={reports ?? []}
        keyExtractor={(item: FormSubmission) => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.md }}>
            <ReportCard report={item} />
          </View>
        )}
        refreshing={isLoading}
        onRefresh={refetch}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
            <Text style={[typography.h1, { color: colors.textPrimary, marginBottom: spacing.xl }]}>Formulare</Text>

            {/* Action Cards */}
            <View style={[styles.cardRow, { marginBottom: spacing.xxl }]}>
              <Pressable
                onPress={() => setActiveView('court-damage')}
                style={({ pressed }) => [
                  styles.actionCard,
                  { backgroundColor: colors.backgroundSecondary, borderRadius: radii.lg, padding: spacing.lg, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View style={[styles.iconCircle, { backgroundColor: colors.warningSurface }]}>
                  <Ionicons name="warning-outline" size={24} color={colors.accent} />
                </View>
                <Text style={[typography.bodyMedium, { color: colors.textPrimary, marginTop: spacing.sm }]}>Platzschaden melden</Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveView('media-upload')}
                style={({ pressed }) => [
                  styles.actionCard,
                  { backgroundColor: colors.backgroundSecondary, borderRadius: radii.lg, padding: spacing.lg, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View style={[styles.iconCircle, { backgroundColor: colors.accentSubtle }]}>
                  <Ionicons name="camera-outline" size={24} color={colors.accentLight} />
                </View>
                <Text style={[typography.bodyMedium, { color: colors.textPrimary, marginTop: spacing.sm }]}>Medien hochladen</Text>
              </Pressable>
            </View>

            {/* Section Title */}
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.md }]}>Meine Meldungen</Text>
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState title="Keine Meldungen" description="Du hast noch keine Meldungen eingereicht" />
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  cardRow: { flexDirection: 'row', gap: 12 },
  actionCard: { flex: 1, alignItems: 'center' },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
