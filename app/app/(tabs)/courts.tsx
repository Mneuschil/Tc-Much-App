import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { LoadingSkeleton, QueryError, EmptyState } from '../../src/components/ui';
import { usePermissions } from '../../src/hooks/usePermissions';
import { useCourtOccupancy } from '../../src/features/courts/hooks/useCourtOccupancy';
import { DateNavigator } from '../../src/features/courts/components/DateNavigator';
import { BookingComingSoonBanner } from '../../src/features/courts/components/BookingComingSoonBanner';
import { CategoryLegend } from '../../src/features/courts/components/CategoryLegend';
import { CourtsTimeline } from '../../src/features/courts/components/CourtsTimeline';
import { SlotDetailModal } from '../../src/features/courts/components/SlotDetailModal';
import { CreateBookingModal } from '../../src/features/courts/components/CreateBookingModal';
import type { CourtSlot } from '../../src/features/courts/services/courtsService';

function toIsoDay(date: Date) {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function CourtsScreen() {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const { canBookCourt } = usePermissions();
  const [date, setDate] = useState(() => new Date());
  const [selectedSlot, setSelectedSlot] = useState<CourtSlot | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const dateKey = toIsoDay(date);
  const { data, isLoading, isError, refetch, isRefetching } = useCourtOccupancy(dateKey);

  const slots = data ?? [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.head, { paddingHorizontal: spacing.xl, paddingTop: spacing.l }]}>
        <Text style={[typography.h1, { color: colors.textPrimary }]}>Plätze</Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          Tagesbelegung der 5 Plätze
        </Text>
      </View>

      <View style={[styles.controls, { paddingHorizontal: spacing.xl, gap: spacing.m }]}>
        <BookingComingSoonBanner />
        <DateNavigator date={date} onChange={setDate} />
        <CategoryLegend />
      </View>

      <View style={[styles.timelineWrap, { marginHorizontal: spacing.xl, marginTop: spacing.m }]}>
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
            description="An diesem Tag ist kein Platz durch Training, Medenspiel oder Verein belegt."
          />
        ) : (
          <CourtsTimeline
            slots={slots}
            onSlotPress={setSelectedSlot}
            onRefresh={refetch}
            refreshing={isRefetching}
            bottomInset={tabBarHeight + spacing.l}
          />
        )}
      </View>

      {canBookCourt && (
        <Pressable
          onPress={() => setCreateOpen(true)}
          accessibilityLabel="Neue Platzbelegung anlegen"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.fab,
            shadows.lg,
            {
              right: spacing.xl,
              bottom: tabBarHeight + spacing.l,
              backgroundColor: colors.buttonPrimary,
              borderRadius: borderRadius.full,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Ionicons name="add" size={28} color={colors.buttonPrimaryText} />
        </Pressable>
      )}

      <SlotDetailModal slot={selectedSlot} onClose={() => setSelectedSlot(null)} />
      <CreateBookingModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        initialDate={date}
      />
    </SafeAreaView>
  );
}

export { ScreenErrorBoundary as ErrorBoundary } from '../../src/components/ScreenErrorBoundary';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  head: {
    paddingBottom: 4,
  },
  controls: {
    paddingTop: 8,
  },
  timelineWrap: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
