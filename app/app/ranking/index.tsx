import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, Modal, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { Avatar, Badge, EmptyState } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';
import { useRankings, useMyChallenges, useCreateChallenge, useRespondChallenge, useMatchHistory } from '../../src/features/ranking/hooks/useRanking';
import { MOCK_RANKINGS } from '../../src/lib/mockData';

interface RankingUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

interface RankingItem {
  id: string;
  rank: number;
  previousRank: number | null;
  points: number;
  wins: number;
  losses: number;
  user: RankingUser;
}

interface ChallengeItem {
  id: string;
  challengerId: string;
  challengedId: string;
  status: string;
  deadline: string | null;
  challenger: RankingUser;
  challenged: RankingUser;
}

interface HistoryEntry {
  id: string;
  opponent: RankingUser;
  result: string;
  score: string;
  date: string;
}

export default function RankingScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { user } = useAuth();
  const { data: rankingsData, isLoading, refetch } = useRankings();
  const { data: challengesData } = useMyChallenges();
  const createChallenge = useCreateChallenge();
  const respondChallenge = useRespondChallenge();

  const [selectedPlayer, setSelectedPlayer] = useState<RankingItem | null>(null);
  const [challengeTarget, setChallengeTarget] = useState<RankingItem | null>(null);

  const rankings = useMemo<RankingItem[]>(() => {
    const api = (rankingsData ?? []) as RankingItem[];
    return api.length > 0 ? api : (MOCK_RANKINGS as RankingItem[]);
  }, [rankingsData]);

  const challenges = useMemo<ChallengeItem[]>(
    () => (challengesData ?? []) as ChallengeItem[],
    [challengesData],
  );

  const myRank = useMemo(
    () => rankings.find(r => r.user.id === user?.id),
    [rankings, user],
  );

  const incomingChallenges = useMemo(
    () => challenges.filter(c => c.challengedId === user?.id && c.status === 'PENDING'),
    [challenges, user],
  );

  const outgoingChallenges = useMemo(
    () => challenges.filter(c => c.challengerId === user?.id && c.status === 'PENDING'),
    [challenges, user],
  );

  const canChallenge = (item: RankingItem): boolean => {
    if (!myRank || !user || item.user.id === user.id) return false;
    if (item.rank >= myRank.rank) return false;
    if (myRank.rank - item.rank > 3) return false;
    return !challenges.some(c =>
      c.status === 'PENDING' && (
        (c.challengerId === user.id && c.challengedId === item.user.id) ||
        (c.challengedId === user.id && c.challengerId === item.user.id)
      ),
    );
  };

  const getMovement = (item: RankingItem) => {
    if (!item.previousRank) return null;
    const diff = item.previousRank - item.rank;
    if (diff > 0) return { icon: 'caret-up' as const, color: colors.success, text: `${diff}` };
    if (diff < 0) return { icon: 'caret-down' as const, color: colors.danger, text: `${Math.abs(diff)}` };
    return null;
  };

  const confirmChallenge = () => {
    if (!challengeTarget) return;
    createChallenge.mutate(challengeTarget.user.id, {
      onSuccess: () => setChallengeTarget(null),
    });
  };

  const renderChallengeBanner = () => {
    if (incomingChallenges.length === 0 && outgoingChallenges.length === 0) return null;
    return (
      <View style={{ marginBottom: spacing.lg }}>
        {incomingChallenges.map(c => (
          <View key={c.id} style={{ backgroundColor: colors.dangerSurface, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.sm }}>
            <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
              {c.challenger.firstName} {c.challenger.lastName} fordert dich heraus!
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
              <Pressable
                onPress={() => respondChallenge.mutate({ challengeId: c.id, action: 'ACCEPT' })}
                style={[styles.bannerBtn, { backgroundColor: colors.success, borderRadius: borderRadius.md }]}
              >
                <Text style={[typography.buttonSmall, { color: colors.textInverse }]}>Annehmen</Text>
              </Pressable>
              <Pressable
                onPress={() => respondChallenge.mutate({ challengeId: c.id, action: 'DECLINE' })}
                style={[styles.bannerBtn, { backgroundColor: colors.danger, borderRadius: borderRadius.md }]}
              >
                <Text style={[typography.buttonSmall, { color: colors.textInverse }]}>Ablehnen</Text>
              </Pressable>
            </View>
          </View>
        ))}
        {outgoingChallenges.map(c => (
          <View key={c.id} style={{ backgroundColor: colors.warningSurface, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[typography.bodyMedium, { color: colors.textPrimary, flex: 1 }]}>
                Du forderst {c.challenged.firstName} {c.challenged.lastName} – warte
              </Text>
              <Badge label="Ausstehend" variant="warning" />
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderRanking = ({ item }: { item: RankingItem }) => {
    const movement = getMovement(item);
    const isTop3 = item.rank <= 3;
    const isMe = item.user.id === user?.id;
    const challengeable = canChallenge(item);

    return (
      <Pressable
        onPress={() => setSelectedPlayer(item)}
        style={[styles.rankRow, {
          backgroundColor: isMe ? colors.accentSubtle : colors.backgroundSecondary,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          marginBottom: spacing.sm,
        }]}
      >
        <View style={[styles.rankBadge, { backgroundColor: isTop3 ? colors.chipActive : colors.surface, borderRadius: borderRadius.md }]}>
          <Text style={[typography.bodyMedium, { color: isTop3 ? colors.textInverse : colors.textPrimary }]}>{item.rank}</Text>
        </View>
        <Avatar firstName={item.user.firstName} lastName={item.user.lastName} imageUrl={item.user.avatarUrl} size="sm" />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
            {item.user.firstName} {item.user.lastName}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {item.wins}S · {item.losses}N · {item.points} Pkt.
          </Text>
        </View>
        {movement ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: challengeable ? spacing.sm : 0 }}>
            <Ionicons name={movement.icon} size={14} color={movement.color} />
            <Text style={[typography.captionMedium, { color: movement.color, marginLeft: 2 }]}>{movement.text}</Text>
          </View>
        ) : (
          <View style={{ marginRight: challengeable ? spacing.sm : 0 }}>
            <Ionicons name="remove-outline" size={16} color={colors.textTertiary} />
          </View>
        )}
        {challengeable && (
          <Pressable
            onPress={() => setChallengeTarget(item)}
            style={[styles.challengeBtn, { backgroundColor: colors.accent, borderRadius: borderRadius.full }]}
          >
            <Text style={[typography.caption, { color: colors.textInverse, fontWeight: '600' }]}>Fordern</Text>
          </Pressable>
        )}
      </Pressable>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Rangliste', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.textPrimary, headerShadowVisible: false }} />
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
        <FlatList
          data={rankings}
          keyExtractor={(item) => item.id}
          renderItem={renderRanking}
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
          ListHeaderComponent={renderChallengeBanner}
          ListEmptyComponent={!isLoading ? <EmptyState title="Keine Rangliste" description="Noch keine Rangliste erstellt" /> : null}
        />
      </SafeAreaView>

      {/* Player Detail Bottom Sheet */}
      <PlayerDetailModal
        player={selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        onChallenge={(p) => { setSelectedPlayer(null); setChallengeTarget(p); }}
        canChallenge={selectedPlayer ? canChallenge(selectedPlayer) : false}
      />

      {/* Challenge Confirm Modal */}
      <Modal visible={challengeTarget !== null} transparent animationType="fade" onRequestClose={() => setChallengeTarget(null)}>
        <Pressable style={[styles.modalOverlay, { backgroundColor: colors.overlay }]} onPress={() => setChallengeTarget(null)}>
          <View style={[styles.confirmCard, { backgroundColor: colors.background, borderRadius: borderRadius.xxl, padding: spacing.xxl }]}>
            <Text style={[typography.h3, { color: colors.textPrimary, textAlign: 'center' }]}>
              Willst du {challengeTarget?.user.firstName} {challengeTarget?.user.lastName} (Rang {challengeTarget?.rank}) herausfordern?
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md }]}>
              Die Herausforderung muss innerhalb von 14 Tagen gespielt werden.
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xxl }}>
              <Pressable
                onPress={() => setChallengeTarget(null)}
                style={[styles.confirmBtn, { backgroundColor: colors.surface, borderRadius: borderRadius.md, flex: 1 }]}
              >
                <Text style={[typography.buttonSmall, { color: colors.textPrimary }]}>Abbrechen</Text>
              </Pressable>
              <Pressable
                onPress={confirmChallenge}
                style={[styles.confirmBtn, { backgroundColor: colors.accent, borderRadius: borderRadius.md, flex: 1 }]}
              >
                <Text style={[typography.buttonSmall, { color: colors.textInverse }]}>Herausfordern</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

interface PlayerDetailModalProps {
  player: RankingItem | null;
  onClose: () => void;
  onChallenge: (player: RankingItem) => void;
  canChallenge: boolean;
}

function PlayerDetailModal({ player, onClose, onChallenge, canChallenge: challengeable }: PlayerDetailModalProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { data: historyData } = useMatchHistory(player?.user.id ?? '');
  const history = (historyData ?? []) as HistoryEntry[];

  const h2hRecord = useMemo(() => {
    if (!player) return { wins: 0, losses: 0 };
    const wins = history.filter(h => h.opponent.id === player.user.id && h.result === 'WIN').length;
    const losses = history.filter(h => h.opponent.id === player.user.id && h.result === 'LOSS').length;
    return { wins, losses };
  }, [history, player]);

  const recentMatches = useMemo(() => history.slice(0, 5), [history]);

  return (
    <Modal visible={player !== null} presentationStyle="pageSheet" animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: spacing.lg }}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, alignItems: 'center' }}>
          {player && (
            <>
              <Avatar firstName={player.user.firstName} lastName={player.user.lastName} imageUrl={player.user.avatarUrl} size="lg" />
              <Text style={[typography.h2, { color: colors.textPrimary, marginTop: spacing.lg }]}>
                {player.user.firstName} {player.user.lastName}
              </Text>
              <Badge label={`Rang ${player.rank}`} variant="accent" />

              <View style={[styles.h2hCard, { backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.xl, padding: spacing.lg, marginTop: spacing.xxl }]}>
                <Text style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.md }]}>H2H Bilanz</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xxl }}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={[typography.h2, { color: colors.success }]}>{h2hRecord.wins}</Text>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>Siege</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={[typography.h2, { color: colors.danger }]}>{h2hRecord.losses}</Text>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>Niederlagen</Text>
                  </View>
                </View>
              </View>

              {recentMatches.length > 0 && (
                <View style={[styles.h2hCard, { backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.xl, padding: spacing.lg, marginTop: spacing.md }]}>
                  <Text style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.md }]}>Letzte 5 Spiele</Text>
                  {recentMatches.map(m => (
                    <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm }}>
                      <Badge label={m.result === 'WIN' ? 'S' : 'N'} variant={m.result === 'WIN' ? 'success' : 'danger'} />
                      <Text style={[typography.bodySmall, { color: colors.textPrimary, marginLeft: spacing.sm, flex: 1 }]}>
                        vs {m.opponent.firstName} {m.opponent.lastName}
                      </Text>
                      <Text style={[typography.caption, { color: colors.textSecondary }]}>{m.score}</Text>
                    </View>
                  ))}
                </View>
              )}

              {challengeable && (
                <Pressable
                  onPress={() => onChallenge(player)}
                  style={[styles.confirmBtn, { backgroundColor: colors.accent, borderRadius: borderRadius.md, marginTop: spacing.xxl, width: '100%' }]}
                >
                  <Text style={[typography.buttonSmall, { color: colors.textInverse }]}>Herausfordern</Text>
                </Pressable>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  rankRow: { flexDirection: 'row', alignItems: 'center' },
  rankBadge: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  challengeBtn: { paddingHorizontal: 14, paddingVertical: 6 },
  bannerBtn: { paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  confirmCard: { width: '100%', maxWidth: 360 },
  confirmBtn: { paddingVertical: 14, alignItems: 'center' },
  h2hCard: { width: '100%' },
});
