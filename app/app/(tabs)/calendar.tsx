import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { EmptyState } from '../../src/components/ui';
import { useEvents } from '../../src/features/calendar/hooks/useEvents';
import { formatDate, formatTime } from '../../src/utils/formatDate';
import { MOCK_EVENTS } from '../../src/lib/mockData';

const EVENT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  LEAGUE_MATCH: 'tennisball', CUP_MATCH: 'trophy', CLUB_CHAMPIONSHIP: 'medal',
  RANKING_MATCH: 'stats-chart', TRAINING: 'fitness', CLUB_EVENT: 'people', TOURNAMENT: 'trophy-outline',
};
const FILTERS = [
  { key: '', label: 'Alle' }, { key: 'LEAGUE_MATCH', label: 'Liga' }, { key: 'TRAINING', label: 'Training' },
  { key: 'CLUB_EVENT', label: 'Events' }, { key: 'RANKING_MATCH', label: 'Rangliste' },
];

export default function CalendarScreen() {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState('');

  const { data, isLoading, refetch } = useEvents(filter || undefined);
  const apiEvents = ((data ?? []) as any[]);
  const allEvents = apiEvents.length > 0 ? apiEvents : MOCK_EVENTS;
  const events = filter ? allEvents.filter((e: any) => e.type === filter) : allEvents;

  const renderEvent = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => router.push(`/match/${item.id}` as any)}
      style={({ pressed }) => [
        { backgroundColor: colors.cardBackground, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.md, opacity: pressed ? 0.9 : 1, ...shadows.sm },
      ]}
    >
      <View style={styles.eventRow}>
        <View style={[styles.eventIcon, { backgroundColor: colors.surface, borderRadius: borderRadius.lg }]}>
          <Ionicons name={EVENT_ICONS[item.type] ?? 'calendar'} size={20} color={colors.textPrimary} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={[typography.bodyMedium, { color: colors.textPrimary }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>{formatDate(item.startDate)} · {formatTime(item.startDate)}</Text>
        </View>
        {item.isHomeGame !== null && item.isHomeGame !== undefined && (
          <View style={[styles.chip, { backgroundColor: item.isHomeGame ? colors.chipActive : colors.chipInactive, borderRadius: borderRadius.full }]}>
            <Text style={[typography.captionMedium, { color: item.isHomeGame ? colors.textInverse : colors.textSecondary }]}>{item.isHomeGame ? 'Heim' : 'Ausw.'}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm }}>
        <Text style={[typography.h1, { color: colors.textPrimary }]}>Kalender</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.sm }}>
        {FILTERS.map((f) => (
          <Pressable key={f.key} onPress={() => setFilter(f.key)}
            style={[{ backgroundColor: filter === f.key ? colors.chipActive : colors.chipInactive, borderRadius: borderRadius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }]}>
            <Text style={[typography.captionMedium, { color: filter === f.key ? colors.textInverse : colors.textPrimary }]}>{f.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <FlatList data={events} keyExtractor={(item) => item.id} renderItem={renderEvent}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
        ListEmptyComponent={!isLoading ? <EmptyState title="Keine Termine" description="Keine Termine gefunden" /> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  eventRow: { flexDirection: 'row', alignItems: 'center' },
  eventIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 10, paddingVertical: 4 },
});
