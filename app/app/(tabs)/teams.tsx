import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { EmptyState } from '../../src/components/ui';
import { useTeams } from '../../src/features/teams/hooks/useTeams';
import { MOCK_TEAMS } from '../../src/lib/mockData';

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  MATCH_TEAM: 'tennisball', TRAINING_GROUP: 'fitness', BOARD_GROUP: 'briefcase',
};
const FILTERS = [
  { key: '', label: 'Alle' }, { key: 'MATCH_TEAM', label: 'Mannschaften' },
  { key: 'TRAINING_GROUP', label: 'Training' }, { key: 'BOARD_GROUP', label: 'Vorstand' },
];

export default function TeamsScreen() {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState('');

  const { data, isLoading, refetch } = useTeams(filter || undefined);
  const apiTeams = ((data ?? []) as any[]);
  const allTeams = apiTeams.length > 0 ? apiTeams : MOCK_TEAMS;
  const teams = filter ? allTeams.filter((t: any) => t.type === filter) : allTeams;

  const renderTeam = ({ item }: { item: any }) => (
    <Pressable onPress={() => router.push(`/team/${item.id}`)}
      style={({ pressed }) => [
        { backgroundColor: colors.cardBackground, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.md, opacity: pressed ? 0.9 : 1, ...shadows.sm },
      ]}>
      <View style={styles.teamRow}>
        <View style={[styles.teamIcon, { backgroundColor: colors.surface, borderRadius: borderRadius.lg }]}>
          <Ionicons name={TYPE_ICONS[item.type] ?? 'people'} size={20} color={colors.textPrimary} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>{item.name}</Text>
          {item.league && <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>{item.league}</Text>}
          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 4 }]}>{item._count.members} Spieler</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </View>
    </Pressable>
  );

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
      <FlatList data={teams} keyExtractor={(item) => item.id} renderItem={renderTeam}
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
