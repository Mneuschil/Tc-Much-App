import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Avatar } from '../ui';
import { formatRelative } from '../../utils/formatDate';

interface PlayerInfo {
  firstName: string;
  lastName: string;
}

interface ResultData {
  player1: PlayerInfo;
  player2: PlayerInfo;
  team1?: string | null;
  team2?: string | null;
  playedAt: string;
  isHomeGame: boolean | null;
}

interface ResultHeroContentProps {
  result: ResultData;
  isTeamMatch: boolean;
  p1Won: boolean;
  label: string;
  homeWins: number;
  awayWins: number;
  setsWon: { player1: number; player2: number };
}

export function ResultHeroContent({
  result,
  isTeamMatch,
  p1Won,
  label,
  homeWins,
  awayWins,
  setsWon,
}: ResultHeroContentProps) {
  const { colors, typography, borderRadius, isDark } = useTheme();

  return (
    <View style={styles.heroInner}>
      <View style={styles.badgeRow}>
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
          ]}
        >
          <Text style={[typography.caption, { color: colors.textSecondary }]}>{label}</Text>
        </View>
        <Text style={[typography.caption, { color: colors.textTertiary }]}>
          {formatRelative(result.playedAt)}
        </Text>
      </View>

      <View style={styles.heroMatch}>
        <View style={styles.heroSide}>
          {isTeamMatch ? (
            <View
              style={[
                styles.teamCircle,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' },
              ]}
            >
              <Ionicons name="shield-half-outline" size={28} color={colors.textSecondary} />
            </View>
          ) : (
            <Avatar
              firstName={result.player1.firstName}
              lastName={result.player1.lastName}
              size="lg"
            />
          )}
          <Text
            style={[
              p1Won ? typography.label : typography.bodySmall,
              {
                color: p1Won ? colors.textPrimary : colors.textSecondary,
                marginTop: 8,
                textAlign: 'center',
              },
            ]}
            numberOfLines={2}
          >
            {isTeamMatch ? result.team1 : result.player1.lastName}
          </Text>
          {isTeamMatch && result.isHomeGame !== null && (
            <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
              {result.isHomeGame ? 'Heim' : 'Auswärts'}
            </Text>
          )}
        </View>

        <View style={styles.heroScore}>
          <View
            style={[
              styles.scorePill,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <Text style={[styles.scoreText, { color: colors.textPrimary }]}>
              {isTeamMatch
                ? `${homeWins} : ${awayWins}`
                : `${setsWon.player1} – ${setsWon.player2}`}
            </Text>
          </View>
        </View>

        <View style={styles.heroSide}>
          {isTeamMatch ? (
            <View
              style={[
                styles.teamCircle,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' },
              ]}
            >
              <Ionicons name="shield-half-outline" size={28} color={colors.textSecondary} />
            </View>
          ) : (
            <Avatar
              firstName={result.player2.firstName}
              lastName={result.player2.lastName}
              size="lg"
            />
          )}
          <Text
            style={[
              !p1Won ? typography.label : typography.bodySmall,
              {
                color: !p1Won ? colors.textPrimary : colors.textSecondary,
                marginTop: 8,
                textAlign: 'center',
              },
            ]}
            numberOfLines={2}
          >
            {isTeamMatch ? result.team2 : result.player2.lastName}
          </Text>
          {isTeamMatch && result.isHomeGame !== null && (
            <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
              {!result.isHomeGame ? 'Heim' : 'Auswärts'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroInner: { padding: 20 },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  heroMatch: { flexDirection: 'row', alignItems: 'center' },
  heroSide: { flex: 1, alignItems: 'center' },
  teamCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroScore: { alignItems: 'center', paddingHorizontal: 8 },
  scorePill: { paddingHorizontal: 20, paddingVertical: 10 },
  scoreText: { fontSize: 28, fontWeight: '800', letterSpacing: 2 },
});
