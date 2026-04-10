import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Avatar } from '../ui';
import { getSetsWon } from '../../features/match/utils/tennisScoring';
import type { TennisSet } from '@tennis-club/shared';

interface PlayerScoreboardProps {
  p1: { firstName: string; lastName: string };
  p2: { firstName: string; lastName: string };
  sets: TennisSet[];
  large?: boolean;
}

export function PlayerScoreboard({ p1, p2, sets, large }: PlayerScoreboardProps) {
  const { colors, typography, borderRadius, isDark } = useTheme();
  const setsWon = getSetsWon(sets);
  const p1Won = setsWon.player1 > setsWon.player2;

  const rowBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  const avatarSize = large ? 'md' : 'sm';
  const nameStyle = large ? typography.bodyMedium : typography.bodySmall;
  const scoreStyle = large
    ? { fontSize: 20, fontWeight: '700' as const }
    : { fontSize: 16, fontWeight: '600' as const };

  const scoreText = sets.map((s) => `${s.games1}:${s.games2}`).join(', ');
  const winnerName = p1Won ? `${p1.firstName} ${p1.lastName}` : `${p2.firstName} ${p2.lastName}`;

  return (
    <View
      style={{ gap: 4 }}
      accessible
      accessibilityLabel={`${p1.firstName} ${p1.lastName} gegen ${p2.firstName} ${p2.lastName}, ${scoreText}, Gewinner ${winnerName}`}
    >
      <View
        style={[
          styles.scoreRow,
          { backgroundColor: rowBg, borderRadius: borderRadius.md, padding: large ? 14 : 10 },
        ]}
      >
        <Avatar firstName={p1.firstName} lastName={p1.lastName} size={avatarSize} />
        <View style={styles.nameCol}>
          <Text
            style={[nameStyle, { color: p1Won ? colors.textPrimary : colors.textSecondary }]}
            numberOfLines={1}
          >
            {p1.firstName} {p1.lastName}
          </Text>
        </View>
        {p1Won && (
          <Ionicons
            name="tennisball"
            size={12}
            color={colors.accentLight}
            style={{ marginRight: 8 }}
            importantForAccessibility="no"
          />
        )}
        {sets.map((s, i) => (
          <Text
            key={i}
            style={[
              scoreStyle,
              styles.setCell,
              {
                color: s.games1 > s.games2 ? colors.textPrimary : colors.textTertiary,
                width: large ? 32 : 26,
              },
            ]}
          >
            {s.games1}
          </Text>
        ))}
      </View>
      <View
        style={[
          styles.scoreRow,
          { backgroundColor: rowBg, borderRadius: borderRadius.md, padding: large ? 14 : 10 },
        ]}
      >
        <Avatar firstName={p2.firstName} lastName={p2.lastName} size={avatarSize} />
        <View style={styles.nameCol}>
          <Text
            style={[nameStyle, { color: !p1Won ? colors.textPrimary : colors.textSecondary }]}
            numberOfLines={1}
          >
            {p2.firstName} {p2.lastName}
          </Text>
        </View>
        {!p1Won && (
          <Ionicons
            name="tennisball"
            size={12}
            color={colors.accentLight}
            style={{ marginRight: 8 }}
            importantForAccessibility="no"
          />
        )}
        {sets.map((s, i) => (
          <Text
            key={i}
            style={[
              scoreStyle,
              styles.setCell,
              {
                color: s.games2 > s.games1 ? colors.textPrimary : colors.textTertiary,
                width: large ? 32 : 26,
              },
            ]}
          >
            {s.games2}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scoreRow: { flexDirection: 'row', alignItems: 'center' },
  nameCol: { flex: 1, marginLeft: 10 },
  setCell: { textAlign: 'center' },
});
