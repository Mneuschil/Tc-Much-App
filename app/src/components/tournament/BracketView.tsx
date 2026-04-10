import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { EmptyState } from '../ui';
import type { TournamentMatch } from '@tennis-club/shared';

export interface TournamentMatchWithPlayers extends TournamentMatch {
  player1?: { id: string; firstName: string; lastName: string } | null;
  player2?: { id: string; firstName: string; lastName: string } | null;
  winner?: { id: string; firstName: string; lastName: string } | null;
}

interface BracketViewProps {
  matches: TournamentMatchWithPlayers[];
  currentUserId: string | undefined;
}

export function BracketView({ matches, currentUserId }: BracketViewProps) {
  const { colors, typography, spacing, radii } = useTheme();

  const rounds = useMemo(() => {
    const roundMap = new Map<number, TournamentMatchWithPlayers[]>();
    for (const match of matches) {
      const existing = roundMap.get(match.round) ?? [];
      existing.push(match);
      roundMap.set(match.round, existing);
    }
    return Array.from(roundMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([round, roundMatches]) => ({
        round,
        matches: roundMatches.sort((a, b) => a.position - b.position),
      }));
  }, [matches]);

  if (matches.length === 0) {
    return (
      <EmptyState
        title="Kein Bracket"
        description="Das Bracket wird nach der Auslosung angezeigt"
      />
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}
    >
      {rounds.map(({ round, matches: roundMatches }) => (
        <View key={round} style={{ width: 160, marginRight: spacing.lg }}>
          <Text
            style={[
              typography.labelSmall,
              { color: colors.textSecondary, marginBottom: spacing.md, textAlign: 'center' },
            ]}
          >
            Runde {round}
          </Text>
          {roundMatches.map((match) => {
            const isOwn =
              currentUserId &&
              (match.player1Id === currentUserId || match.player2Id === currentUserId);
            const p1Name = match.player1
              ? `${match.player1.firstName} ${match.player1.lastName.charAt(0)}.`
              : 'TBD';
            const p2Name = match.player2
              ? `${match.player2.firstName} ${match.player2.lastName.charAt(0)}.`
              : 'TBD';
            const isP1Winner = match.winnerId && match.player1Id === match.winnerId;
            const isP2Winner = match.winnerId && match.player2Id === match.winnerId;

            const winnerLabel = isP1Winner ? p1Name : isP2Winner ? p2Name : undefined;

            return (
              <View
                key={match.id}
                accessible
                accessibilityLabel={`${p1Name} gegen ${p2Name}${match.score ? `, ${match.score}` : ''}${winnerLabel ? `, Gewinner ${winnerLabel}` : ''}`}
                style={[
                  styles.bracketCard,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: radii.sm,
                    padding: spacing.sm,
                    marginBottom: spacing.md,
                    borderWidth: isOwn ? 1.5 : 0,
                    borderColor: isOwn ? colors.accent : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    typography.bodySmall,
                    { color: colors.textPrimary, fontWeight: isP1Winner ? '700' : '400' },
                  ]}
                  numberOfLines={1}
                >
                  {p1Name}
                </Text>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textTertiary, textAlign: 'center', marginVertical: 2 },
                  ]}
                >
                  vs
                </Text>
                <Text
                  style={[
                    typography.bodySmall,
                    { color: colors.textPrimary, fontWeight: isP2Winner ? '700' : '400' },
                  ]}
                  numberOfLines={1}
                >
                  {p2Name}
                </Text>
                {match.score && (
                  <Text
                    style={[
                      typography.caption,
                      { color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
                    ]}
                  >
                    {match.score}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bracketCard: { overflow: 'hidden' },
});
