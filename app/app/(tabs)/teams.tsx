import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, Pressable, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { EmptyState } from '../../src/components/ui';
import { useMyTeams } from '../../src/features/teams/hooks/useMyTeams';
import { useWeekEvents } from '../../src/features/calendar/hooks/useEvents';
import { formatDate } from '../../src/utils/formatDate';
import { MOCK_TEAMS, MOCK_EVENTS } from '../../src/lib/mockData';

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  MATCH_TEAM: 'tennisball', TRAINING_GROUP: 'fitness', BOARD_GROUP: 'briefcase',
};
const FILTERS = [
  { key: '', label: 'Alle' }, { key: 'MATCH_TEAM', label: 'Mannschaften' },
  { key: 'TRAINING_GROUP', label: 'Training' }, { key: 'BOARD_GROUP', label: 'Vorstand' },
];

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

export default function TeamsScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState('');

  const { myTeams: apiMyTeams, otherTeams: apiOtherTeams, isLoading, refetch, data } = useMyTeams();
  const { data: weekEventsData } = useWeekEvents();

  const allApiTeams = (data ?? []) as TeamItem[];
  const hasMockData = allApiTeams.length === 0;

  const myTeams = (hasMockData ? MOCK_TEAMS.slice(0, 2) : apiMyTeams) as TeamItem[];
  const otherTeams = (hasMockData ? MOCK_TEAMS.slice(2) : apiOtherTeams) as TeamItem[];

  const upcomingEvents = ((weekEventsData ?? []).length > 0 ? weekEventsData : MOCK_EVENTS) as EventItem[];

  // Map teamId → next match
  const nextMatchByTeam = useMemo(() => {
    const map = new Map<string, EventItem>();
    const sorted = [...upcomingEvents]
      .filter(e => e.teamId && e.type?.includes('MATCH'))
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    for (const ev of sorted) {
      if (ev.teamId && !map.has(ev.teamId)) {
        map.set(ev.teamId, ev);
      }
    }
    return map;
  }, [upcomingEvents]);

  const applyFilter = (teams: TeamItem[]) =>
    filter ? teams.filter(t => t.type === filter) : teams;

  const filteredMy = applyFilter(myTeams);
  const filteredOther = applyFilter(otherTeams);

  const sections = [
    ...(filteredMy.length > 0 ? [{ title: 'Meine Teams', data: filteredMy }] : []),
    ...(filteredOther.length > 0 ? [{ title: 'Alle Teams', data: filteredOther }] : []),
  ];

  const renderTeam = ({ item }: { item: TeamItem }) => {
    const nextMatch = nextMatchByTeam.get(item.id);
    return (
      <Pressable onPress={() => router.push(`/team/${item.id}`)}
        style={({ pressed }) => [
          { backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.md, opacity: pressed ? 0.9 : 1 },
        ]}>
        <View style={styles.teamRow}>
          <View style={[styles.teamIcon, { backgroundColor: colors.surface, borderRadius: borderRadius.lg }]}>
            <Ionicons name={TYPE_ICONS[item.type] ?? 'people'} size={20} color={colors.textPrimary} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>{item.name}</Text>
            {item.league && <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>{item.league}</Text>}
            {nextMatch && (
              <Text style={[typography.caption, { color: colors.accentLight, marginTop: 2 }]} numberOfLines={1}>
                Nächstes Spiel: {nextMatch.title}, {formatDate(nextMatch.startDate)}
              </Text>
            )}
            <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 4 }]}>{item._count.members} Spieler</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm }}>
        <Text style={[typography.h1, { color: colors.textPrimary }]}>Teams</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.sm }}>
        {FILTERS.map((f) => (
          <Pressable key={f.key} onPress={() => setFilter(f.key)}
            style={[{ backgroundColor: filter === f.key ? colors.chipActive : colors.chipInactive, borderRadius: borderRadius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }]}>
            <Text style={[typography.captionMedium, { color: filter === f.key ? colors.textInverse : colors.textPrimary }]}>{f.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderTeam}
        renderSectionHeader={({ section }) => (
          <Text style={[typography.captionMedium, { color: colors.textSecondary, paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm }]}>
            {section.title}
          </Text>
        )}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
        ListEmptyComponent={!isLoading ? <EmptyState title="Keine Teams" description="Keine Teams angelegt" /> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  teamRow: { flexDirection: 'row', alignItems: 'center' },
  teamIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
