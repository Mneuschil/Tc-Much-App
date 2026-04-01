import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { Avatar, EmptyState } from '../../src/components/ui';
import { useRankings } from '../../src/features/ranking/hooks/useRanking';
import { MOCK_RANKINGS } from '../../src/lib/mockData';

export default function RankingScreen() {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const { data, isLoading, refetch } = useRankings();
  const apiRankings = ((data ?? []) as any[]);
  const rankings = apiRankings.length > 0 ? apiRankings : MOCK_RANKINGS;

  const getMovement = (item: any) => {
    if (!item.previousRank) return null;
    const diff = item.previousRank - item.rank;
    if (diff > 0) return { icon: 'caret-up' as const, color: colors.success, text: `${diff}` };
    if (diff < 0) return { icon: 'caret-down' as const, color: colors.danger, text: `${Math.abs(diff)}` };
    return null;
  };

  const renderRanking = ({ item, index }: { item: any; index: number }) => {
    const movement = getMovement(item);
    const isTop3 = item.rank <= 3;
    return (
      <View style={[styles.rankRow, { backgroundColor: colors.cardBackground, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.sm, ...shadows.sm }]}>
        <View style={[styles.rankBadge, { backgroundColor: isTop3 ? colors.chipActive : colors.surface, borderRadius: borderRadius.md }]}>
          <Text style={[typography.bodyMedium, { color: isTop3 ? '#FFFFFF' : colors.textPrimary }]}>{item.rank}</Text>
        </View>
        <Avatar firstName={item.user.firstName} lastName={item.user.lastName} imageUrl={item.user.avatarUrl} size="sm" />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>{item.user.firstName} {item.user.lastName}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>{item.wins}S · {item.losses}N · {item.points} Pkt.</Text>
        </View>
        {movement && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name={movement.icon} size={14} color={movement.color} />
            <Text style={[typography.captionMedium, { color: movement.color, marginLeft: 2 }]}>{movement.text}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Rangliste', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.textPrimary, headerShadowVisible: false }} />
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
        <FlatList data={rankings} keyExtractor={(item) => item.id} renderItem={renderRanking}
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
          ListEmptyComponent={!isLoading ? <EmptyState title="Keine Rangliste" description="Noch keine Rangliste erstellt" /> : null}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  rankRow: { flexDirection: 'row', alignItems: 'center' },
  rankBadge: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
});
