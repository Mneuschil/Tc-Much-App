import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Avatar } from '../ui';
import { formatMatchScore, getSetsWon } from '../../features/match/utils/tennisScoring';
import { formatRelative } from '../../utils/formatDate';
import type { TennisSet } from '@tennis-club/shared';

interface ResultPlayer {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

export interface SingleMatch {
  position: number;
  player1: ResultPlayer;
  player2: ResultPlayer;
  sets: TennisSet[];
  winnerId: 'player1' | 'player2';
}

export interface RecentResult {
  id: string;
  type: 'LEAGUE_MATCH' | 'CUP_MATCH' | 'RANKING_MATCH' | 'CLUB_CHAMPIONSHIP';
  title: string;
  team1: string | null;
  team2: string | null;
  player1: ResultPlayer;
  player2: ResultPlayer;
  sets: TennisSet[];
  winnerId: 'player1' | 'player2';
  isHomeGame: boolean | null;
  playedAt: string;
  matches: SingleMatch[];
}

const TYPE_LABELS: Record<string, string> = {
  LEAGUE_MATCH: 'Medenspiel',
  CUP_MATCH: 'Pokal',
  RANKING_MATCH: 'Rangliste',
  CLUB_CHAMPIONSHIP: 'Clubmeisterschaft',
};

interface RecentResultsProps {
  results: RecentResult[];
}

export function RecentResults({ results }: RecentResultsProps) {
  const { colors, typography, spacing } = useTheme();

  if (results.length === 0) return null;

  return (
    <View>
      <Text
        style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.md }]}
        accessibilityRole="header"
      >
        Ergebnisse
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={300 + spacing.md}
        contentContainerStyle={{ paddingRight: spacing.xl }}
      >
        {results.map((r) => (
          <ResultCard key={r.id} result={r} />
        ))}
      </ScrollView>
    </View>
  );
}

function ResultCard({ result }: { result: RecentResult }) {
  const { colors, typography, spacing, borderRadius, isDark } = useTheme();
  const router = useRouter();

  const setsWon = getSetsWon(result.sets);
  const p1Won = result.winnerId === 'player1';
  const label = TYPE_LABELS[result.type] ?? result.type;
  const scoreText = formatMatchScore(result.sets);
  const isTeamMatch = result.type === 'LEAGUE_MATCH' || result.type === 'CUP_MATCH';

  const accentColor =
    result.type === 'RANKING_MATCH'
      ? colors.warning
      : result.type === 'CLUB_CHAMPIONSHIP'
        ? colors.accent
        : colors.danger;

  return (
    <Pressable
      onPress={() => router.push(`/result/${result.id}` as never)}
      accessibilityLabel={`${label}: ${result.team1 ?? result.player1.lastName} gegen ${result.team2 ?? result.player2.lastName}, ${isTeamMatch ? `${setsWon.player1} zu ${setsWon.player2}` : scoreText}`}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.backgroundSecondary,
          borderRadius: borderRadius.xl,
          marginRight: spacing.md,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      {/* Type badge + time */}
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
          ]}
        >
          <View
            style={[styles.typeDot, { backgroundColor: accentColor }]}
            importantForAccessibility="no"
          />
          <Text style={[typography.caption, { color: colors.textSecondary }]}>{label}</Text>
        </View>
        <Text style={[typography.caption, { color: colors.textTertiary }]}>
          {formatRelative(result.playedAt)}
        </Text>
      </View>

      {/* Sides + Score */}
      <View style={styles.matchRow}>
        {/* Side 1 */}
        <View style={styles.playerCol}>
          {isTeamMatch && result.team1 ? (
            <View
              style={[
                styles.teamIcon,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
              ]}
              importantForAccessibility="no"
              accessibilityElementsHidden
            >
              <Ionicons name="shield-half-outline" size={22} color={colors.textSecondary} />
            </View>
          ) : (
            <Avatar
              firstName={result.player1.firstName}
              lastName={result.player1.lastName}
              size="md"
            />
          )}
          <Text
            style={[
              p1Won ? typography.bodyMedium : typography.bodySmall,
              {
                color: p1Won ? colors.textPrimary : colors.textSecondary,
                marginTop: 6,
                textAlign: 'center',
              },
            ]}
            numberOfLines={2}
          >
            {isTeamMatch && result.team1 ? result.team1 : result.player1.lastName}
          </Text>
          {isTeamMatch && result.isHomeGame !== null && (
            <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
              {result.isHomeGame ? 'Heim' : 'Ausw.'}
            </Text>
          )}
        </View>

        {/* Score */}
        <View style={styles.scoreCol}>
          <View
            style={[
              styles.setsBox,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderRadius: borderRadius.md,
              },
            ]}
          >
            <Text style={[styles.setsText, { color: colors.textPrimary }]}>
              {isTeamMatch
                ? `${setsWon.player1} : ${setsWon.player2}`
                : `${setsWon.player1} – ${setsWon.player2}`}
            </Text>
          </View>
          {!isTeamMatch && (
            <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 4 }]}>
              {scoreText}
            </Text>
          )}
        </View>

        {/* Side 2 */}
        <View style={styles.playerCol}>
          {isTeamMatch && result.team2 ? (
            <View
              style={[
                styles.teamIcon,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
              ]}
              importantForAccessibility="no"
              accessibilityElementsHidden
            >
              <Ionicons name="shield-half-outline" size={22} color={colors.textSecondary} />
            </View>
          ) : (
            <Avatar
              firstName={result.player2.firstName}
              lastName={result.player2.lastName}
              size="md"
            />
          )}
          <Text
            style={[
              !p1Won ? typography.bodyMedium : typography.bodySmall,
              {
                color: !p1Won ? colors.textPrimary : colors.textSecondary,
                marginTop: 6,
                textAlign: 'center',
              },
            ]}
            numberOfLines={2}
          >
            {isTeamMatch && result.team2 ? result.team2 : result.player2.lastName}
          </Text>
          {isTeamMatch && result.isHomeGame !== null && (
            <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
              {!result.isHomeGame ? 'Heim' : 'Ausw.'}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 300, overflow: 'hidden', padding: 16 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  typeDot: { width: 6, height: 6, borderRadius: 3 },
  matchRow: { flexDirection: 'row', alignItems: 'center' },
  playerCol: { flex: 1, alignItems: 'center' },
  scoreCol: { alignItems: 'center', paddingHorizontal: 8 },
  setsBox: { paddingHorizontal: 16, paddingVertical: 8 },
  setsText: { fontSize: 22, fontWeight: '700', letterSpacing: 2 },
  teamIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
