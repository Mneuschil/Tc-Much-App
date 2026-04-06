import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { Avatar, Badge, Card, EmptyState, QueryError } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';
import { usePermissions } from '../../src/hooks/usePermissions';
import { useEvent } from '../../src/features/calendar/hooks/useEvents';
import {
  useAvailability,
  useSetAvailability,
} from '../../src/features/teams/hooks/useAvailability';
import {
  useLineup,
  useSetLineup,
  useAutoGenerateLineup,
} from '../../src/features/teams/hooks/useLineup';
import {
  useMatchResults,
  useSubmitResult,
  useConfirmResult,
  useRejectResult,
} from '../../src/features/match/hooks/useMatchResult';
import { formatDate, formatTime } from '../../src/utils/formatDate';
import { formatMatchScore, isValidSet } from '../../src/features/match/utils/tennisScoring';
import { ScoreInput } from '../../src/components/match/ScoreInput';
import { LineupEditor } from '../../src/components/match/LineupEditor';
import { LineupReadonly } from '../../src/components/match/LineupReadonly';
import type { LineupEntry } from '../../src/components/match/types';
import type { TennisSet } from '@tennis-club/shared';

interface LineupApiEntry {
  id: string;
  eventId: string;
  teamId: string;
  userId: string;
  position: number;
  user: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
}

/* ─── MatchStatusBadge ────────────────────────────────────────────── */

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'neutral' | 'warning' | 'success' | 'danger' | 'info' | 'accent' }
> = {
  SCHEDULED: { label: 'Geplant', variant: 'neutral' },
  RESULT_PENDING: { label: 'Ergebnis offen', variant: 'warning' },
  COMPLETED: { label: 'Beendet', variant: 'success' },
  DISPUTED: { label: 'Angefochten', variant: 'danger' },
  CANCELLED: { label: 'Abgesagt', variant: 'danger' },
  SUBMITTED: { label: 'Eingereicht', variant: 'warning' },
  CONFIRMED: { label: 'Bestätigt', variant: 'success' },
  REJECTED: { label: 'Abgelehnt', variant: 'danger' },
};

function MatchStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: 'neutral' as const };
  return <Badge label={config.label} variant={config.variant} />;
}

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { user } = useAuth();
  const { isBoard, isTeamCaptain } = usePermissions();
  const canManageLineup = isBoard || isTeamCaptain;

  const { data: eventData, isError: isEventError, refetch: refetchEvent } = useEvent(id!);
  const { data: availData } = useAvailability(id!);
  const setAvailability = useSetAvailability(id!);
  const { data: lineupData } = useLineup(id!);
  const setLineup = useSetLineup(id!);
  const autoGenerate = useAutoGenerateLineup(id!);
  const { data: resultsData } = useMatchResults(id!);
  const confirmResult = useConfirmResult(id!);
  const rejectResult = useRejectResult(id!);
  const submitResult = useSubmitResult();

  const event = eventData as
    | {
        title: string;
        status: string;
        startDate: string;
        location?: string;
        court?: string;
        teamId?: string;
        isHomeGame?: boolean;
        team?: { id: string; name: string };
      }
    | undefined;
  const availabilities = (availData ?? []) as Array<{
    id: string;
    status: string;
    comment: string | null;
    user: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  }>;
  const results = (resultsData ?? []) as Array<{
    id: string;
    eventId: string;
    status: string;
    sets: TennisSet[];
    winnerId: string;
    submittedById: string;
    submittedBy: { id: string; firstName: string; lastName: string };
    winner: { id: string; firstName: string; lastName: string } | null;
  }>;
  // API returns flat array of MatchLineup, not { entries: [...] }
  const lineupRaw = lineupData;
  const lineupEntries: LineupEntry[] = useMemo(() => {
    const raw = Array.isArray(lineupRaw) ? lineupRaw : [];
    return (raw as LineupApiEntry[]).map((e) => ({
      userId: e.userId,
      position: e.position,
      isStarter: true,
      user: e.user,
    }));
  }, [lineupRaw]);
  const lineupTeamId =
    Array.isArray(lineupRaw) && lineupRaw.length > 0
      ? (lineupRaw[0] as LineupApiEntry).teamId
      : undefined;

  const myAvailability = availabilities.find((a) => a.user?.id === user?.id);
  const available = availabilities.filter((a) => a.status === 'AVAILABLE');
  const unavailable = availabilities.filter((a) => a.status === 'NOT_AVAILABLE');
  const maybe = availabilities.filter((a) => a.status === 'MAYBE');

  // Lineup state
  const [localStarters, setLocalStarters] = useState<LineupEntry[]>([]);
  const [localSubs, setLocalSubs] = useState<LineupEntry[]>([]);
  const [lineupInit, setLineupInit] = useState(false);

  const starters = useMemo(() => {
    if (lineupInit) return localStarters;
    return lineupEntries.sort((a, b) => a.position - b.position);
  }, [lineupEntries, lineupInit, localStarters]);

  const substitutes = useMemo(() => {
    if (lineupInit) return localSubs;
    return [];
  }, [lineupInit, localSubs]);

  const initLocalLineup = () => {
    setLocalStarters(lineupEntries.sort((a, b) => a.position - b.position));
    setLocalSubs([]);
    setLineupInit(true);
  };

  const handleAutoGenerate = () => {
    if (!event?.teamId) return;
    autoGenerate.mutate(event.teamId, {
      onSuccess: () => setLineupInit(false),
    });
  };

  const handleConfirmLineup = () => {
    if (!lineupTeamId && !event?.teamId) return;
    const teamId = lineupTeamId ?? event!.teamId!;
    const allEntries = [
      ...localStarters.map((e, i) => ({ userId: e.userId, position: i + 1 })),
      ...localSubs.map((e, i) => ({ userId: e.userId, position: i + localStarters.length + 1 })),
    ];
    setLineup.mutate(
      { teamId, lineup: allEntries },
      {
        onSuccess: () => {
          setLineupInit(false);
          Alert.alert('Erfolg', 'Aufstellung gespeichert');
        },
      },
    );
  };

  // Score input state
  const [sets, setSets] = useState<TennisSet[]>([
    { games1: 0, games2: 0, tiebreak1: null, tiebreak2: null },
  ]);
  const [winnerId, _setWinnerId] = useState('');

  const addSet = () =>
    setSets((prev) => [...prev, { games1: 0, games2: 0, tiebreak1: null, tiebreak2: null }]);

  const updateSet = (index: number, field: keyof TennisSet, value: number | null) => {
    setSets((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const handleSubmitResult = () => {
    if (!results[0]?.id) return;
    if (!winnerId) {
      Alert.alert('Fehler', 'Bitte Gewinner auswaehlen');
      return;
    }
    if (!sets.every(isValidSet)) {
      Alert.alert('Fehler', 'Bitte gueltige Saetze eingeben');
      return;
    }
    submitResult.mutate({ matchId: results[0].id, sets, winnerId, eventId: id! });
  };

  if (!event) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Match' }} />
        <SafeAreaView edges={['bottom']} style={[styles.container]}>
          {isEventError ? <QueryError onRetry={refetchEvent} /> : null}
        </SafeAreaView>
      </>
    );
  }

  const matchStatus = results[0]?.status ?? event.status ?? '';
  const isParticipant = availabilities.some((a) => a.user?.id === user?.id);
  const canSubmitResult =
    (matchStatus === 'SCHEDULED' || matchStatus === 'IN_PROGRESS') &&
    (isParticipant || canManageLineup);
  const canConfirm = matchStatus === 'RESULT_PENDING' && results[0]?.submittedById !== user?.id;
  const isCompleted = matchStatus === 'COMPLETED';

  const AVAIL_OPTIONS = [
    {
      status: 'AVAILABLE' as const,
      label: 'Kann spielen',
      icon: 'checkmark-circle' as const,
      activeColor: colors.chipActive,
      iconColor: colors.success,
    },
    {
      status: 'MAYBE' as const,
      label: 'Unsicher',
      icon: 'help-circle' as const,
      activeColor: colors.warning,
      iconColor: colors.warning,
    },
    {
      status: 'NOT_AVAILABLE' as const,
      label: 'Kann nicht',
      icon: 'close-circle' as const,
      activeColor: colors.chipActive,
      iconColor: colors.danger,
    },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: event.title,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView
        edges={['bottom']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {isEventError ? <QueryError onRetry={refetchEvent} /> : null}
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 60 }}>
          {/* Event Info */}
          <Card variant="elevated">
            {event.team && (
              <Text style={[typography.captionMedium, { color: colors.textSecondary }]}>
                {event.team.name}
              </Text>
            )}
            <Text style={[typography.h2, { color: colors.textPrimary, marginTop: spacing.xs }]}>
              {event.title}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: spacing.md }}>
              {event.isHomeGame !== null && event.isHomeGame !== undefined && (
                <Badge
                  label={event.isHomeGame ? 'Heim' : 'Auswaerts'}
                  variant={event.isHomeGame ? 'dark' : 'neutral'}
                />
              )}
              {matchStatus && <MatchStatusBadge status={matchStatus} />}
            </View>
            <View style={[styles.infoRow, { marginTop: spacing.xl }]}>
              <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
              <Text
                style={[typography.body, { color: colors.textPrimary, marginLeft: spacing.sm }]}
              >
                {formatDate(event.startDate)} · {formatTime(event.startDate)}
              </Text>
            </View>
            {event.location && (
              <View style={[styles.infoRow, { marginTop: spacing.sm }]}>
                <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
                <Text
                  style={[typography.body, { color: colors.textPrimary, marginLeft: spacing.sm }]}
                >
                  {event.location}
                </Text>
              </View>
            )}
            {event.court && (
              <View style={[styles.infoRow, { marginTop: spacing.sm }]}>
                <Ionicons name="grid-outline" size={18} color={colors.textSecondary} />
                <Text
                  style={[typography.body, { color: colors.textPrimary, marginLeft: spacing.sm }]}
                >
                  {event.court}
                </Text>
              </View>
            )}
          </Card>

          {/* Results (existing + confirmed) */}
          {results.length > 0 && results[0].status !== 'SCHEDULED' && (
            <View style={{ marginTop: spacing.xxl }}>
              <Text
                style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.md }]}
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

          {/* Score Submit */}
          {canSubmitResult && (
            <View style={{ marginTop: spacing.xxl }}>
              <Text
                style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.md }]}
              >
                Ergebnis melden
              </Text>
              <ScoreInput sets={sets} onUpdateSet={updateSet} onAddSet={addSet} readOnly={false} />
              <Pressable
                onPress={handleSubmitResult}
                style={[
                  styles.primaryBtn,
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

          {/* Result Confirm / Reject */}
          {canConfirm && (
            <View style={{ marginTop: spacing.xxl }}>
              <Text
                style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.md }]}
              >
                Ergebnis bestaetigen
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <Pressable
                  onPress={() => confirmResult.mutate()}
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: colors.success, borderRadius: borderRadius.lg, flex: 1 },
                  ]}
                >
                  <Text style={[typography.buttonSmall, { color: colors.textInverse }]}>
                    Stimmt
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => rejectResult.mutate({ reason: 'Ergebnis stimmt nicht' })}
                  style={[
                    styles.primaryBtn,
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

          {/* Completed Score (readonly) */}
          {isCompleted && results.length > 0 && (
            <View style={{ marginTop: spacing.xxl }}>
              <Text
                style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.md }]}
              >
                Endergebnis
              </Text>
              <ScoreInput
                sets={results[0].sets}
                onUpdateSet={() => {}}
                onAddSet={() => {}}
                readOnly
              />
            </View>
          )}

          {/* Availability */}
          <View style={{ marginTop: spacing.xxl }}>
            <Text style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.md }]}>
              Verfuegbarkeit
            </Text>
            <View style={styles.availButtons}>
              {AVAIL_OPTIONS.map((opt) => {
                const isSelected = myAvailability?.status === opt.status;
                const isMaybe = opt.status === 'MAYBE';
                return (
                  <Pressable
                    key={opt.status}
                    onPress={() => setAvailability.mutate({ status: opt.status })}
                    style={[
                      styles.availButton,
                      {
                        backgroundColor: isSelected
                          ? isMaybe
                            ? colors.warningSurface
                            : colors.chipActive
                          : colors.backgroundSecondary,
                        borderRadius: borderRadius.xl,
                        padding: spacing.lg,
                        borderWidth: isSelected && isMaybe ? 1 : 0,
                        borderColor: isSelected && isMaybe ? colors.warning : 'transparent',
                      },
                    ]}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={28}
                      color={isSelected && !isMaybe ? colors.textInverse : opt.iconColor}
                    />
                    <Text
                      style={[
                        typography.captionMedium,
                        {
                          color: isSelected && !isMaybe ? colors.textInverse : colors.textPrimary,
                          marginTop: spacing.xs,
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {available.length > 0 && (
              <View style={{ marginTop: spacing.lg }}>
                <Text
                  style={[
                    typography.captionMedium,
                    { color: colors.success, marginBottom: spacing.sm },
                  ]}
                >
                  Verfuegbar ({available.length})
                </Text>
                {available.map((a) => (
                  <View key={a.id} style={[styles.personRow, { paddingVertical: spacing.sm }]}>
                    <Avatar firstName={a.user.firstName} lastName={a.user.lastName} size="xs" />
                    <Text
                      style={[
                        typography.bodySmall,
                        { color: colors.textPrimary, marginLeft: spacing.sm },
                      ]}
                    >
                      {a.user.firstName} {a.user.lastName}
                    </Text>
                    {a.comment && (
                      <Text
                        style={[
                          typography.caption,
                          { color: colors.textTertiary, marginLeft: 'auto' },
                        ]}
                      >
                        {a.comment}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
            {maybe.length > 0 && (
              <View style={{ marginTop: spacing.md }}>
                <Text
                  style={[
                    typography.captionMedium,
                    { color: colors.warning, marginBottom: spacing.sm },
                  ]}
                >
                  Unsicher ({maybe.length})
                </Text>
                {maybe.map((a) => (
                  <View key={a.id} style={[styles.personRow, { paddingVertical: spacing.sm }]}>
                    <Avatar firstName={a.user.firstName} lastName={a.user.lastName} size="xs" />
                    <Text
                      style={[
                        typography.bodySmall,
                        { color: colors.textPrimary, marginLeft: spacing.sm },
                      ]}
                    >
                      {a.user.firstName} {a.user.lastName}
                    </Text>
                    {a.comment && (
                      <Text
                        style={[
                          typography.caption,
                          { color: colors.textTertiary, marginLeft: 'auto' },
                        ]}
                      >
                        {a.comment}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
            {unavailable.length > 0 && (
              <View style={{ marginTop: spacing.md }}>
                <Text
                  style={[
                    typography.captionMedium,
                    { color: colors.danger, marginBottom: spacing.sm },
                  ]}
                >
                  Nicht verfuegbar ({unavailable.length})
                </Text>
                {unavailable.map((a) => (
                  <View key={a.id} style={[styles.personRow, { paddingVertical: spacing.sm }]}>
                    <Avatar firstName={a.user.firstName} lastName={a.user.lastName} size="xs" />
                    <Text
                      style={[
                        typography.bodySmall,
                        { color: colors.textPrimary, marginLeft: spacing.sm },
                      ]}
                    >
                      {a.user.firstName} {a.user.lastName}
                    </Text>
                    {a.comment && (
                      <Text
                        style={[
                          typography.caption,
                          { color: colors.textTertiary, marginLeft: 'auto' },
                        ]}
                      >
                        {a.comment}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Lineup Section */}
          <View style={{ marginTop: spacing.xxl }}>
            <Text style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.md }]}>
              Aufstellung
            </Text>
            {starters.length === 0 && substitutes.length === 0 ? (
              <EmptyState
                title="Aufstellung noch nicht erstellt"
                description="Die Aufstellung wird vom Captain erstellt"
              />
            ) : canManageLineup ? (
              <LineupEditor
                starters={starters}
                substitutes={substitutes}
                onStartersChange={(items) => {
                  if (!lineupInit) initLocalLineup();
                  setLocalStarters(items);
                }}
                onSubsChange={(items) => {
                  if (!lineupInit) initLocalLineup();
                  setLocalSubs(items);
                }}
                onAutoGenerate={handleAutoGenerate}
                onConfirm={handleConfirmLineup}
                isLoading={setLineup.isPending || autoGenerate.isPending}
              />
            ) : (
              <LineupReadonly starters={starters} substitutes={substitutes} />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  availButtons: { flexDirection: 'row', gap: 12 },
  availButton: { flex: 1, alignItems: 'center' },
  personRow: { flexDirection: 'row', alignItems: 'center' },
  primaryBtn: { paddingVertical: 14, alignItems: 'center' },
});
