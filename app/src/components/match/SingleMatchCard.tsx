import { View, Text } from 'react-native';
import { useTheme } from '../../theme';
import { PlayerScoreboard } from './PlayerScoreboard';
import type { SingleMatch } from '../home/RecentResults';

interface SingleMatchCardProps {
  match: SingleMatch;
}

export function SingleMatchCard({ match }: SingleMatchCardProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  return (
    <View
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.sm,
      }}
    >
      <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: spacing.sm }]}>
        Spiel {match.position}
      </Text>
      <PlayerScoreboard p1={match.player1} p2={match.player2} sets={match.sets} />
    </View>
  );
}
