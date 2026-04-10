import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Avatar, Badge } from '../ui';
import { useMatchHistory } from '../../features/ranking/hooks/useRanking';

interface RankingUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface RankingItem {
  id: string;
  rank: number;
  previousRank: number | null;
  points: number;
  wins: number;
  losses: number;
  user: RankingUser;
}

interface HistoryEntry {
  id: string;
  opponent: RankingUser;
  result: string;
  score: string;
  date: string;
}

export interface PlayerDetailModalProps {
  player: RankingItem | null;
  onClose: () => void;
  onChallenge: (player: RankingItem) => void;
  canChallenge: boolean;
}

export function PlayerDetailModal({
  player,
  onClose,
  onChallenge,
  canChallenge: challengeable,
}: PlayerDetailModalProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { data: historyData } = useMatchHistory(player?.user.id ?? '');
  const history = useMemo(() => (historyData ?? []) as HistoryEntry[], [historyData]);

  const h2hRecord = useMemo(() => {
    if (!player) return { wins: 0, losses: 0 };
    const wins = history.filter(
      (h) => h.opponent.id === player.user.id && h.result === 'WIN',
    ).length;
    const losses = history.filter(
      (h) => h.opponent.id === player.user.id && h.result === 'LOSS',
    ).length;
    return { wins, losses };
  }, [history, player]);

  const recentMatches = useMemo(() => history.slice(0, 5), [history]);

  return (
    <Modal
      visible={player !== null}
      presentationStyle="pageSheet"
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: spacing.lg }}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityLabel="Modal schließen"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, alignItems: 'center' }}>
          {player && (
            <>
              <Avatar
                firstName={player.user.firstName}
                lastName={player.user.lastName}
                imageUrl={player.user.avatarUrl}
                size="lg"
              />
              <Text style={[typography.h2, { color: colors.textPrimary, marginTop: spacing.lg }]}>
                {player.user.firstName} {player.user.lastName}
              </Text>
              <Badge label={`Rang ${player.rank}`} variant="accent" />

              <View
                style={[
                  styles.h2hCard,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: borderRadius.xl,
                    padding: spacing.lg,
                    marginTop: spacing.xxl,
                  },
                ]}
              >
                <Text
                  style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.md }]}
                >
                  H2H Bilanz
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xxl }}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={[typography.h2, { color: colors.success }]}>{h2hRecord.wins}</Text>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>Siege</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={[typography.h2, { color: colors.danger }]}>
                      {h2hRecord.losses}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      Niederlagen
                    </Text>
                  </View>
                </View>
              </View>

              {recentMatches.length > 0 && (
                <View
                  style={[
                    styles.h2hCard,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderRadius: borderRadius.xl,
                      padding: spacing.lg,
                      marginTop: spacing.md,
                    },
                  ]}
                >
                  <Text
                    style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.md }]}
                  >
                    Letzte 5 Spiele
                  </Text>
                  {recentMatches.map((m) => (
                    <View
                      key={m.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: spacing.sm,
                      }}
                    >
                      <Badge
                        label={m.result === 'WIN' ? 'S' : 'N'}
                        variant={m.result === 'WIN' ? 'success' : 'danger'}
                      />
                      <Text
                        style={[
                          typography.bodySmall,
                          { color: colors.textPrimary, marginLeft: spacing.sm, flex: 1 },
                        ]}
                      >
                        vs {m.opponent.firstName} {m.opponent.lastName}
                      </Text>
                      <Text style={[typography.caption, { color: colors.textSecondary }]}>
                        {m.score}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {challengeable && (
                <Pressable
                  onPress={() => onChallenge(player)}
                  accessibilityLabel={`${player.user.firstName} ${player.user.lastName} herausfordern`}
                  accessibilityRole="button"
                  style={[
                    styles.confirmBtn,
                    {
                      backgroundColor: colors.accent,
                      borderRadius: borderRadius.md,
                      marginTop: spacing.xxl,
                      width: '100%',
                    },
                  ]}
                >
                  <Text style={[typography.buttonSmall, { color: colors.textInverse }]}>
                    Herausfordern
                  </Text>
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
  h2hCard: { width: '100%' },
  confirmBtn: { paddingVertical: 14, alignItems: 'center' },
});
