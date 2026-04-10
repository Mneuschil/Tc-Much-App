import { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, RefreshControl, Modal } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { Avatar, Badge, EmptyState, QueryError } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';
import {
  useRankings,
  useMyChallenges,
  useCreateChallenge,
  useRespondChallenge,
} from '../../src/features/ranking/hooks/useRanking';
import { PlayerDetailModal } from '../../src/components/ranking/PlayerDetailModal';
import type { RankingItem } from '../../src/components/ranking/PlayerDetailModal';

interface RankingUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
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

export default function RankingScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { user } = useAuth();
  const { data: rankingsData, isLoading, isError, refetch } = useRankings();
  const { data: challengesData } = useMyChallenges();
  const createChallenge = useCreateChallenge();
  const respondChallenge = useRespondChallenge();

  const [selectedPlayer, setSelectedPlayer] = useState<RankingItem | null>(null);
  const [challengeTarget, setChallengeTarget] = useState<RankingItem | null>(null);

  const rankings = useMemo<RankingItem[]>(
    () => (rankingsData ?? []) as RankingItem[],
    [rankingsData],
  );

  const challenges = useMemo<ChallengeItem[]>(
    () => (challengesData ?? []) as ChallengeItem[],
    [challengesData],
  );

  const myRank = useMemo(() => rankings.find((r) => r.user.id === user?.id), [rankings, user]);

  const incomingChallenges = useMemo(
    () => challenges.filter((c) => c.challengedId === user?.id && c.status === 'PENDING'),
    [challenges, user],
  );

  const outgoingChallenges = useMemo(
    () => challenges.filter((c) => c.challengerId === user?.id && c.status === 'PENDING'),
    [challenges, user],
  );

  const canChallenge = useCallback(
    (item: RankingItem): boolean => {
      if (!myRank || !user || item.user.id === user.id) return false;
      if (item.rank >= myRank.rank) return false;
      if (myRank.rank - item.rank > 3) return false;
      return !challenges.some(
        (c) =>
          c.status === 'PENDING' &&
          ((c.challengerId === user.id && c.challengedId === item.user.id) ||
            (c.challengedId === user.id && c.challengerId === item.user.id)),
      );
    },
    [myRank, user, challenges],
  );

  const getMovement = useCallback(
    (item: RankingItem) => {
      if (!item.previousRank) return null;
      const diff = item.previousRank - item.rank;
      if (diff > 0) return { icon: 'caret-up' as const, color: colors.success, text: `${diff}` };
      if (diff < 0)
        return { icon: 'caret-down' as const, color: colors.danger, text: `${Math.abs(diff)}` };
      return null;
    },
    [colors.success, colors.danger],
  );

  const confirmChallenge = () => {
    if (!challengeTarget) return;
    createChallenge.mutate(challengeTarget.user.id, {
      onSuccess: () => setChallengeTarget(null),
    });
  };

  const renderChallengeBanner = useCallback(() => {
    if (incomingChallenges.length === 0 && outgoingChallenges.length === 0) return null;
    return (
      <View style={styles.challengeSection}>
        {incomingChallenges.map((c) => (
          <View
            key={c.id}
            style={[
              styles.challengeCard,
              { backgroundColor: colors.dangerSurface, borderRadius: borderRadius.xl },
            ]}
          >
            <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
              {c.challenger?.firstName ?? ''} {c.challenger?.lastName ?? ''} fordert dich heraus!
            </Text>
            <View style={styles.challengeButtonRow}>
              <Pressable
                onPress={() => respondChallenge.mutate({ challengeId: c.id, action: 'ACCEPT' })}
                style={[
                  styles.bannerBtn,
                  { backgroundColor: colors.success, borderRadius: borderRadius.md },
                ]}
              >
                <Text style={[typography.buttonSmall, { color: colors.textInverse }]}>
                  Annehmen
                </Text>
              </Pressable>
              <Pressable
                onPress={() => respondChallenge.mutate({ challengeId: c.id, action: 'DECLINE' })}
                style={[
                  styles.bannerBtn,
                  { backgroundColor: colors.danger, borderRadius: borderRadius.md },
                ]}
              >
                <Text style={[typography.buttonSmall, { color: colors.textInverse }]}>
                  Ablehnen
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
        {outgoingChallenges.map((c) => (
          <View
            key={c.id}
            style={[
              styles.challengeCard,
              { backgroundColor: colors.warningSurface, borderRadius: borderRadius.xl },
            ]}
          >
            <View style={styles.challengeHeader}>
              <Text style={[typography.bodyMedium, { color: colors.textPrimary, flex: 1 }]}>
                Du forderst {c.challenged?.firstName ?? ''} {c.challenged?.lastName ?? ''} – warte
              </Text>
              <Badge label="Ausstehend" variant="warning" />
            </View>
          </View>
        ))}
      </View>
    );
  }, [incomingChallenges, outgoingChallenges, respondChallenge, colors, typography, borderRadius]);

  const renderRanking = useCallback(
    ({ item }: { item: RankingItem }) => {
      const movement = getMovement(item);
      const isTop3 = item.rank <= 3;
      const isMe = item.user.id === user?.id;
      const challengeable = canChallenge(item);

      const movementLabel = movement
        ? movement.icon === 'caret-up'
          ? `${movement.text} Plätze gestiegen`
          : `${movement.text} Plätze gefallen`
        : 'unverändert';

      return (
        <Pressable
          onPress={() => setSelectedPlayer(item)}
          accessible
          accessibilityLabel={`Rang ${item.rank}, ${item.user.firstName} ${item.user.lastName}, ${item.wins} Siege, ${item.losses} Niederlagen, ${item.points} Punkte, ${movementLabel}`}
          accessibilityRole="button"
          style={[
            styles.rankRow,
            {
              backgroundColor: isMe ? colors.accentSubtle : colors.backgroundSecondary,
              borderRadius: borderRadius.xl,
              padding: spacing.lg,
              marginBottom: spacing.sm,
            },
          ]}
        >
          <View
            style={[
              styles.rankBadge,
              {
                backgroundColor: isTop3 ? colors.chipActive : colors.surface,
                borderRadius: borderRadius.md,
              },
            ]}
          >
            <Text
              style={[
                typography.bodyMedium,
                { color: isTop3 ? colors.textInverse : colors.textPrimary },
              ]}
            >
              {item.rank}
            </Text>
          </View>
          <Avatar
            firstName={item.user.firstName}
            lastName={item.user.lastName}
            imageUrl={item.user.avatarUrl}
            size="sm"
          />
          <View style={styles.playerInfo}>
            <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
              {item.user.firstName} {item.user.lastName}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {item.wins}S · {item.losses}N · {item.points} Pkt.
            </Text>
          </View>
          {movement ? (
            <View
              style={[styles.movementRow, challengeable && styles.movementSpacer]}
              importantForAccessibility="no"
            >
              <Ionicons name={movement.icon} size={14} color={movement.color} />
              <Text style={[typography.captionMedium, { color: movement.color, marginLeft: 2 }]}>
                {movement.text}
              </Text>
            </View>
          ) : (
            <View
              style={challengeable ? styles.movementSpacer : undefined}
              importantForAccessibility="no"
            >
              <Ionicons name="remove-outline" size={16} color={colors.textTertiary} />
            </View>
          )}
          {challengeable && (
            <Pressable
              onPress={() => setChallengeTarget(item)}
              accessibilityLabel={`${item.user.firstName} ${item.user.lastName} herausfordern`}
              accessibilityRole="button"
              style={[
                styles.challengeBtn,
                { backgroundColor: colors.accent, borderRadius: borderRadius.full },
              ]}
            >
              <Text style={[typography.caption, { color: colors.textInverse, fontWeight: '600' }]}>
                Fordern
              </Text>
            </Pressable>
          )}
        </Pressable>
      );
    },
    [getMovement, canChallenge, user, colors, typography, spacing, borderRadius],
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Rangliste',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView
        edges={['bottom']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <FlashList
          data={rankings}
          keyExtractor={(item) => item.id}
          renderItem={renderRanking}
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />
          }
          ListHeaderComponent={renderChallengeBanner}
          ListEmptyComponent={
            !isLoading ? (
              isError ? (
                <QueryError onRetry={refetch} />
              ) : (
                <EmptyState title="Keine Rangliste" description="Noch keine Rangliste erstellt" />
              )
            ) : null
          }
        />
      </SafeAreaView>

      {/* Player Detail Bottom Sheet */}
      <PlayerDetailModal
        player={selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        onChallenge={(p) => {
          setSelectedPlayer(null);
          setChallengeTarget(p);
        }}
        canChallenge={selectedPlayer ? canChallenge(selectedPlayer) : false}
      />

      {/* Challenge Confirm Modal */}
      <Modal
        visible={challengeTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setChallengeTarget(null)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          onPress={() => setChallengeTarget(null)}
        >
          <View
            style={[
              styles.confirmCard,
              {
                backgroundColor: colors.background,
                borderRadius: borderRadius.xxl,
                padding: spacing.xxl,
              },
            ]}
          >
            <Text style={[typography.h3, { color: colors.textPrimary, textAlign: 'center' }]}>
              Willst du {challengeTarget?.user.firstName} {challengeTarget?.user.lastName} (Rang{' '}
              {challengeTarget?.rank}) herausfordern?
            </Text>
            <Text
              style={[
                typography.caption,
                { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md },
              ]}
            >
              Die Herausforderung muss innerhalb von 14 Tagen gespielt werden.
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                onPress={() => setChallengeTarget(null)}
                style={[
                  styles.confirmBtn,
                  { backgroundColor: colors.surface, borderRadius: borderRadius.md, flex: 1 },
                ]}
              >
                <Text style={[typography.buttonSmall, { color: colors.textPrimary }]}>
                  Abbrechen
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmChallenge}
                style={[
                  styles.confirmBtn,
                  { backgroundColor: colors.accent, borderRadius: borderRadius.md, flex: 1 },
                ]}
              >
                <Text style={[typography.buttonSmall, { color: colors.textInverse }]}>
                  Herausfordern
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  rankRow: { flexDirection: 'row', alignItems: 'center' },
  rankBadge: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playerInfo: { flex: 1, marginLeft: 12 },
  movementRow: { flexDirection: 'row', alignItems: 'center' },
  movementSpacer: { marginRight: 8 },
  challengeBtn: { paddingHorizontal: 14, paddingVertical: 6 },
  challengeSection: { marginBottom: 16 },
  challengeCard: { padding: 16, marginBottom: 8 },
  challengeButtonRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  challengeHeader: { flexDirection: 'row', alignItems: 'center' },
  confirmActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  bannerBtn: { paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  confirmCard: { width: '100%', maxWidth: 360 },
  confirmBtn: { paddingVertical: 14, alignItems: 'center' },
});
