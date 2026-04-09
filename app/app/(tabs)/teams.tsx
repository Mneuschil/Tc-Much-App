import { useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { EmptyState, QueryError } from '../../src/components/ui';
import { useMyTeams } from '../../src/features/teams/hooks/useMyTeams';
import { useWeekEvents } from '../../src/features/calendar/hooks/useEvents';
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
    const visible = myTeams.filter((t) => t.type !== 'TRAINING_GROUP');
    const mannschaften = visible.filter((t) => t.type === 'MATCH_TEAM');
    const organisation = visible.filter((t) => t.type === 'BOARD_GROUP');
    const result: TeamSection[] = [];
    if (mannschaften.length > 0) {
      result.push({
        title: 'Mannschaften',
        subtitle: `${mannschaften.length} ${mannschaften.length === 1 ? 'Team' : 'Teams'}`,
        data: mannschaften,
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

  const renderTeam = ({ item }: { item: TeamItem }) => {
    const isMatch = item.type === 'MATCH_TEAM';
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
                backgroundColor: isMatch ? colors.accentSurface : colors.backgroundTertiary,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <Ionicons
              name={isMatch ? 'tennisball' : 'briefcase'}
              size={20}
              color={isMatch ? colors.accent : colors.textPrimary}
            />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>{item.name}</Text>
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
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md }}
      >
        <Text style={[typography.h1, { color: colors.textPrimary }]}>Teams</Text>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderTeam}
        renderSectionHeader={({ section }) => (
          <View
            style={{
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.lg,
              paddingBottom: spacing.md,
              backgroundColor: colors.background,
            }}
          >
            <Text style={[typography.h3, { color: colors.textPrimary }]}>{section.title}</Text>
            <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
              {section.subtitle}
            </Text>
          </View>
        )}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />
        }
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
  teamRow: { flexDirection: 'row', alignItems: 'center' },
  teamIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
