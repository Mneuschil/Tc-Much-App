import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useTheme } from '../../theme';
import { MatchStatusBadge } from './EventInfoCard';
import { ScoreInput } from './ScoreInput';
import { formatMatchScore, isValidSet } from '../../features/match/utils/tennisScoring';
import type { TennisSet } from '@tennis-club/shared';

interface MatchResult {
  id: string;
  status: string;
  sets: TennisSet[];
  winnerId: string;
  submittedById: string;
  submittedBy: { firstName: string; lastName: string };
  winner: { firstName: string; lastName: string } | null;
}

interface ResultsSectionProps {
  results: MatchResult[];
  matchStatus: string;
  canSubmitResult: boolean;
  canConfirm: boolean;
  isCompleted: boolean;
  eventId: string;
  onSubmitResult: (data: {
    matchId: string;
    sets: TennisSet[];
    winnerId: string;
    eventId: string;
  }) => void;
  onConfirm: () => void;
  onReject: (data: { reason: string }) => void;
}

export function ResultsSection({
  results,
  canSubmitResult,
  canConfirm,
  isCompleted,
  eventId,
  onSubmitResult,
  onConfirm,
  onReject,
}: ResultsSectionProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const [sets, setSets] = useState<TennisSet[]>([
    { games1: 0, games2: 0, tiebreak1: null, tiebreak2: null },
  ]);
  const [winnerId, _setWinnerId] = useState('');

  const addSet = () =>
    setSets((prev) => [...prev, { games1: 0, games2: 0, tiebreak1: null, tiebreak2: null }]);

  const updateSet = (index: number, field: keyof TennisSet, value: number | null) => {
    setSets((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const handleSubmit = () => {
    if (!results[0]?.id) return;
    if (!winnerId) {
      Alert.alert('Fehler', 'Bitte Gewinner auswählen');
      return;
    }
    if (!sets.every(isValidSet)) {
      Alert.alert('Fehler', 'Bitte gültige Sätze eingeben');
      return;
    }
    onSubmitResult({ matchId: results[0].id, sets, winnerId, eventId });
  };

  return (
    <>
      {/* Existing results */}
      {results.length > 0 && results[0].status !== 'SCHEDULED' && (
        <View style={{ marginTop: spacing.xxl }}>
          <Text
            style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.md }]}
            accessibilityRole="header"
          >
            Ergebnisse
          </Text>
          {results.map((r) => (
            <View
              key={r.id}
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: borderRadius.xl,
                padding: spacing.lg,
                marginBottom: spacing.sm,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={[typography.h3, { color: colors.textPrimary }]}>
                  {formatMatchScore(r.sets)}
                </Text>
                <MatchStatusBadge status={r.status} />
              </View>
              {r.winner && (
                <Text
                  style={[typography.caption, { color: colors.success, marginTop: spacing.sm }]}
                >
                  Gewinner: {r.winner.firstName} {r.winner.lastName}
                </Text>
              )}
              <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
                Eingereicht von: {r.submittedBy.firstName} {r.submittedBy.lastName}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Score submit */}
      {canSubmitResult && (
        <View style={{ marginTop: spacing.xxl }}>
          <Text
            style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.md }]}
            accessibilityRole="header"
          >
            Ergebnis melden
          </Text>
          <ScoreInput sets={sets} onUpdateSet={updateSet} onAddSet={addSet} readOnly={false} />
          <Pressable
            onPress={handleSubmit}
            accessibilityLabel="Ergebnis absenden"
            accessibilityRole="button"
            style={[
              styles.btn,
              {
                backgroundColor: colors.chipActive,
                borderRadius: borderRadius.lg,
                marginTop: spacing.lg,
              },
            ]}
          >
            <Text style={[typography.buttonSmall, { color: colors.textInverse }]}>
              Ergebnis absenden
            </Text>
          </Pressable>
        </View>
      )}

      {/* Confirm / reject */}
      {canConfirm && (
        <View style={{ marginTop: spacing.xxl }}>
          <Text
            style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.md }]}
            accessibilityRole="header"
          >
            Ergebnis bestaetigen
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Pressable
              onPress={onConfirm}
              accessibilityLabel="Ergebnis bestätigen"
              accessibilityRole="button"
              style={[
                styles.btn,
                { backgroundColor: colors.success, borderRadius: borderRadius.lg, flex: 1 },
              ]}
            >
              <Text style={[typography.buttonSmall, { color: colors.textInverse }]}>Stimmt</Text>
            </Pressable>
            <Pressable
              onPress={() => onReject({ reason: 'Ergebnis stimmt nicht' })}
              accessibilityLabel="Ergebnis ablehnen"
              accessibilityRole="button"
              style={[
                styles.btn,
                { backgroundColor: colors.danger, borderRadius: borderRadius.lg, flex: 1 },
              ]}
            >
              <Text style={[typography.buttonSmall, { color: colors.textInverse }]}>
                Stimmt nicht
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Completed readonly */}
      {isCompleted && results.length > 0 && (
        <View style={{ marginTop: spacing.xxl }}>
          <Text
            style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.md }]}
            accessibilityRole="header"
          >
            Endergebnis
          </Text>
          <ScoreInput sets={results[0].sets} onUpdateSet={() => {}} onAddSet={() => {}} readOnly />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 14, alignItems: 'center' },
});
