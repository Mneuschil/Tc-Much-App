import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme';
import { LoadingSkeleton, QueryError, EmptyState } from '../../src/components/ui';
import { useCourtOccupancy } from '../../src/features/courts/hooks/useCourtOccupancy';
import { DateNavigator } from '../../src/features/courts/components/DateNavigator';
import { BookingComingSoonBanner } from '../../src/features/courts/components/BookingComingSoonBanner';
import { CategoryLegend } from '../../src/features/courts/components/CategoryLegend';
import { CourtsTimeline } from '../../src/features/courts/components/CourtsTimeline';

function toIsoDay(date: Date) {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function CourtsScreen() {
  const { colors, typography, spacing } = useTheme();
  const [date, setDate] = useState(() => new Date());
  const dateKey = toIsoDay(date);
  const { data, isLoading, isError, refetch, isRefetching } = useCourtOccupancy(dateKey);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const slots = data ?? [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { paddingHorizontal: spacing.xl, paddingTop: spacing.l }]}>
        <Text style={[typography.h1, { color: colors.textPrimary }]}>Plätze</Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          Tagesbelegung der 5 Plätze
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.m, gap: spacing.l }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
      >
        <BookingComingSoonBanner />
        <DateNavigator date={date} onChange={setDate} />
        <CategoryLegend />

        <View style={styles.timelineWrap}>
          {isLoading ? (
            <View style={{ gap: spacing.s }}>
              <LoadingSkeleton width="100%" height={56} borderRadius={12} />
              <LoadingSkeleton width="100%" height={56} borderRadius={12} />
              <LoadingSkeleton width="100%" height={56} borderRadius={12} />
              <LoadingSkeleton width="100%" height={56} borderRadius={12} />
            </View>
          ) : isError ? (
            <QueryError onRetry={refetch} />
          ) : slots.length === 0 ? (
            <EmptyState
              title="Keine Belegungen"
              description="An diesem Tag ist kein Platz durch Training, Match oder Rangliste belegt."
            />
          ) : (
            <CourtsTimeline slots={slots} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export { ScreenErrorBoundary as ErrorBoundary } from '../../src/components/ScreenErrorBoundary';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingBottom: 8,
  },
  scroll: {
    flex: 1,
  },
  timelineWrap: {
    minHeight: 400,
    height: 600,
  },
});
