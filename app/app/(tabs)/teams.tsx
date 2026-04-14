import { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { EmptyState, QueryError } from '../../src/components/ui';
import { useMyTeams } from '../../src/features/teams/hooks/useMyTeams';
import { useWeekEvents } from '../../src/features/calendar/hooks/useEvents';
import { useRefreshOnFocus } from '../../src/hooks/useRefreshOnFocus';
import { formatDate } from '../../src/utils/formatDate';

interface TeamItem {
  id: string;
  name: string;
  type: string;
  league: string | null;
  _count: { members: number };
  members?: Array<{ userId: string; user: { id: string } }>;
}

interface EventItem {
  id: string;
  title: string;
  type: string;
  startDate: string;
  teamId: string | null;
  opponent?: string;
}

interface TeamSection {
  title: string;
  subtitle: string;
  data: TeamItem[];
}

export default function TeamsScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();

  const { myTeams: apiMyTeams, isLoading, isError, refetch } = useMyTeams();
  useRefreshOnFocus(refetch);
  const { data: weekEventsData } = useWeekEvents();

  const myTeams = useMemo(() => (apiMyTeams ?? []) as TeamItem[], [apiMyTeams]);
  const upcomingEvents = useMemo(() => (weekEventsData ?? []) as EventItem[], [weekEventsData]);

  const nextMatchByTeam = useMemo(() => {
    const map = new Map<string, EventItem>();
    const sorted = [...upcomingEvents]
      .filter((e) => e.teamId && e.type?.includes('MATCH'))
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    for (const ev of sorted) {
      if (ev.teamId && !map.has(ev.teamId)) map.set(ev.teamId, ev);
    }
    return map;
  }, [upcomingEvents]);

  const sections: TeamSection[] = useMemo(() => {
    const mannschaften = myTeams.filter((t) => t.type === 'MATCH_TEAM');
    const training = myTeams.filter((t) => t.type === 'TRAINING_GROUP');
    const organisation = myTeams.filter((t) => t.type === 'BOARD_GROUP');
    const result: TeamSection[] = [];
    if (mannschaften.length > 0) {
      result.push({
        title: 'Mannschaften',
        subtitle: `${mannschaften.length} ${mannschaften.length === 1 ? 'Team' : 'Teams'}`,
        data: mannschaften,
      });
    }
    if (training.length > 0) {
      result.push({
        title: 'Trainingsgruppen',
        subtitle: `${training.length} ${training.length === 1 ? 'Gruppe' : 'Gruppen'}`,
        data: training,
      });
    }
    if (organisation.length > 0) {
      result.push({
        title: 'Organisation',
        subtitle: `${organisation.length} ${organisation.length === 1 ? 'Team' : 'Teams'}`,
        data: organisation,
      });
    }
    return result;
  }, [myTeams]);

  const getTeamIcon = useCallback(
    (type: string): { name: keyof typeof Ionicons.glyphMap; accent: boolean } => {
      if (type === 'MATCH_TEAM') return { name: 'tennisball', accent: true };
      if (type === 'TRAINING_GROUP') return { name: 'fitness', accent: true };
      return { name: 'briefcase', accent: false };
    },
    [],
  );

  type TeamsListItem =
    | { type: 'header'; title: string; subtitle: string }
    | { type: 'item'; data: TeamItem };

  const flatData = useMemo(() => {
    const result: TeamsListItem[] = [];
    sections.forEach((section) => {
      result.push({ type: 'header', title: section.title, subtitle: section.subtitle });
      section.data.forEach((item) => result.push({ type: 'item', data: item }));
    });
    return result;
  }, [sections]);

  const renderTeam = useCallback(
    (item: TeamItem) => {
      const icon = getTeamIcon(item.type);
      const nextMatch = nextMatchByTeam.get(item.id);
      return (
        <Pressable
          onPress={() => router.push(`/team/${item.id}`)}
          style={({ pressed }) => [
            {
              backgroundColor: colors.backgroundSecondary,
              borderRadius: borderRadius.xl,
              padding: spacing.lg,
              marginBottom: spacing.md,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <View style={styles.teamRow}>
            <View
              style={[
                styles.teamIcon,
                {
                  backgroundColor: icon.accent ? colors.accentSurface : colors.backgroundTertiary,
                  borderRadius: borderRadius.lg,
                },
              ]}
            >
              <Ionicons
                name={icon.name}
                size={20}
                color={icon.accent ? colors.accent : colors.textPrimary}
              />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
                {item.name}
              </Text>
              {item.league && (
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                  {item.league}
                </Text>
              )}
              {nextMatch && (
                <Text
                  style={[typography.caption, { color: colors.accentLight, marginTop: 2 }]}
                  numberOfLines={1}
                >
                  Nächstes Spiel: {nextMatch.title}, {formatDate(nextMatch.startDate)}
                </Text>
              )}
              <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 4 }]}>
                {item._count.members} {item._count.members === 1 ? 'Mitglied' : 'Mitglieder'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </View>
        </Pressable>
      );
    },
    [colors, typography, spacing, borderRadius, router, nextMatchByTeam, getTeamIcon],
  );

  const renderTeamsItem = useCallback(
    ({ item }: { item: TeamsListItem }) => {
      if (item.type === 'header') {
        return (
          <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
            <Text accessibilityRole="header" style={[typography.h3, { color: colors.textPrimary }]}>
              {item.title}
            </Text>
            <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
              {item.subtitle}
            </Text>
          </View>
        );
      }
      return renderTeam(item.data);
    },
    [renderTeam, colors.background, colors.textPrimary, colors.textTertiary, typography],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md }}
      >
        <Text accessibilityRole="header" style={[typography.h1, { color: colors.textPrimary }]}>
          Teams
        </Text>
      </View>
      <FlashList
        data={flatData}
        getItemType={(item) => item.type}
        keyExtractor={(item) => (item.type === 'header' ? `header-${item.title}` : item.data.id)}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />
        }
        renderItem={renderTeamsItem}
        ListEmptyComponent={
          !isLoading ? (
            isError ? (
              <QueryError onRetry={refetch} />
            ) : (
              <EmptyState title="Keine Teams" description="Du bist noch in keinem Team Mitglied" />
            )
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionHeader: { paddingTop: 16, paddingBottom: 12 },
  teamRow: { flexDirection: 'row', alignItems: 'center' },
  teamIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});

export { ScreenErrorBoundary as ErrorBoundary } from '../../src/components/ScreenErrorBoundary';
