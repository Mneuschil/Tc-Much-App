import { View, Text, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { differenceInDays } from 'date-fns';
import { useTheme } from '../../src/theme';
import { Badge, EmptyState } from '../../src/components/ui';
import { useTournaments } from '../../src/features/tournaments/hooks/useTournaments';
import { useRefreshOnFocus } from '../../src/hooks/useRefreshOnFocus';
import { formatDate } from '../../src/utils/formatDate';
import type { Tournament, TournamentStatus, TournamentCategory } from '@tennis-club/shared';

const STATUS_BADGE: Record<
  TournamentStatus,
  { label: string; variant: 'success' | 'warning' | 'neutral' }
> = {
  REGISTRATION_OPEN: { label: 'Anmeldung offen', variant: 'success' },
  IN_PROGRESS: { label: 'Laufend', variant: 'warning' },
  COMPLETED: { label: 'Abgeschlossen', variant: 'neutral' },
};

const CATEGORY_LABELS: Record<TournamentCategory, string> = {
  SINGLES: 'Einzel',
  DOUBLES: 'Doppel',
  MIXED: 'Mixed',
};

export default function TournamentsScreen() {
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { data: tournaments, isLoading, refetch } = useTournaments();
  useRefreshOnFocus(refetch);

  const renderTournament = ({ item }: { item: Tournament }) => {
    const statusInfo = STATUS_BADGE[item.status];
    const daysUntil = differenceInDays(new Date(item.startDate), new Date());
    const showDeadline = item.status === 'REGISTRATION_OPEN' && daysUntil >= 0 && daysUntil < 7;

    return (
      <Pressable
        onPress={() => router.push(`/tournament/${item.id}` as never)}
        style={({ pressed }) => [
          {
            backgroundColor: colors.backgroundSecondary,
            borderRadius: radii.lg,
            padding: spacing.l,
            marginBottom: spacing.md,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <Text style={[typography.h3, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.sm }}>
          <Badge label={statusInfo.label} variant={statusInfo.variant} size="sm" />
          <Badge label={CATEGORY_LABELS[item.category]} variant="accent" size="sm" />
        </View>
        <Text
          style={[typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.sm }]}
        >
          {formatDate(item.startDate)}
          {item.maxParticipants ? ` · Max. ${item.maxParticipants} Teilnehmer` : ''}
        </Text>
        {showDeadline && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
            <Ionicons name="time-outline" size={14} color={colors.warning} />
            <Text style={[typography.caption, { color: colors.warning, marginLeft: 4 }]}>
              Anmeldung endet in {daysUntil} {daysUntil === 1 ? 'Tag' : 'Tagen'}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.lg }}
      >
        <Text accessibilityRole="header" style={[typography.h1, { color: colors.textPrimary }]}>
          Turniere
        </Text>
      </View>
      <FlashList
        data={(tournaments ?? []) as Tournament[]}
        keyExtractor={(item) => item.id}
        renderItem={renderTournament}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />
        }
        ListFooterComponent={
          <Pressable
            onPress={() => router.push('/ranking' as never)}
            style={({ pressed }) => [
              {
                backgroundColor: colors.backgroundSecondary,
                borderRadius: radii.lg,
                padding: spacing.l,
                marginTop: spacing.md,
                opacity: pressed ? 0.9 : 1,
                flexDirection: 'row',
                alignItems: 'center',
              },
            ]}
          >
            <Ionicons name="stats-chart" size={20} color={colors.accent} />
            <Text
              style={[
                typography.label,
                { color: colors.textPrimary, flex: 1, marginLeft: spacing.md },
              ]}
            >
              Rangliste
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title="Keine Turniere"
              description="Laufende und kommende Turniere erscheinen hier"
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export { ScreenErrorBoundary as ErrorBoundary } from '../../src/components/ScreenErrorBoundary';
