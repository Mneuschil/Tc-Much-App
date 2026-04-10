import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  InteractionManager,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { EmptyState, QueryError, LoadingSkeleton } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';
import { usePermissions } from '../../src/hooks/usePermissions';
import { useEvent, useDeleteEvent } from '../../src/features/calendar/hooks/useEvents';
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
import { EventInfoCard } from '../../src/components/match/EventInfoCard';
import { AvailabilitySection } from '../../src/components/match/AvailabilitySection';
import { ResultsSection } from '../../src/components/match/ResultsSection';
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

interface EventData {
  title: string;
  status: string;
  startDate: string;
  location?: string;
  court?: string;
  teamId?: string;
  isHomeGame?: boolean;
  team?: { id: string; name: string };
}

interface AvailabilityEntry {
  id: string;
  status: string;
  comment: string | null;
  user: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
}

interface ResultEntry {
  id: string;
  eventId: string;
  status: string;
  sets: TennisSet[];
  winnerId: string;
  submittedById: string;
  submittedBy: { id: string; firstName: string; lastName: string };
  winner: { id: string; firstName: string; lastName: string } | null;
}

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { isBoard, isTeamCaptain, isAdmin } = usePermissions();
  const canManageLineup = isBoard || isTeamCaptain;

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setReady(true);
    });
    return () => task.cancel();
  }, []);

  const { data: eventData, isError: isEventError, refetch: refetchEvent } = useEvent(id!);
  const deleteEvent = useDeleteEvent(id!);
  const { data: availData } = useAvailability(id!);
  const setAvailability = useSetAvailability(id!);
  const { data: lineupData } = useLineup(id!);
  const setLineup = useSetLineup(id!);
  const autoGenerate = useAutoGenerateLineup(id!);
  const { data: resultsData } = useMatchResults(id!);
  const confirmResult = useConfirmResult(id!);
  const rejectResult = useRejectResult(id!);
  const submitResult = useSubmitResult();

  const event = eventData as EventData | undefined;
  const availabilities = (availData ?? []) as AvailabilityEntry[];
  const results = (resultsData ?? []) as ResultEntry[];

  const lineupEntries: LineupEntry[] = useMemo(() => {
    const raw = Array.isArray(lineupData) ? lineupData : [];
    return (raw as LineupApiEntry[]).map((e) => ({
      userId: e.userId,
      position: e.position,
      isStarter: true,
      user: e.user,
    }));
  }, [lineupData]);
  const lineupTeamId =
    Array.isArray(lineupData) && lineupData.length > 0
      ? (lineupData[0] as LineupApiEntry).teamId
      : undefined;

  const myAvailability = availabilities.find((a) => a.user?.id === user?.id);

  // Lineup local state
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

  if (!ready || !event) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Match' }} />
        <SafeAreaView edges={['bottom']} style={styles.container}>
          {isEventError ? (
            <QueryError onRetry={refetchEvent} />
          ) : (
            <View style={{ padding: spacing.xl, gap: spacing.md }}>
              <LoadingSkeleton width="100%" height={120} borderRadius={16} />
              <LoadingSkeleton width="60%" height={20} />
              <LoadingSkeleton width="100%" height={80} borderRadius={16} />
            </View>
          )}
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

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: event.title,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
          headerRight: isAdmin
            ? () => (
                <Pressable
                  onPress={() =>
                    Alert.alert('Event löschen', 'Dieses Event wirklich löschen?', [
                      { text: 'Abbrechen', style: 'cancel' },
                      {
                        text: 'Löschen',
                        style: 'destructive',
                        onPress: () =>
                          deleteEvent.mutate(undefined, { onSuccess: () => router.back() }),
                      },
                    ])
                  }
                  hitSlop={12}
                >
                  <Ionicons name="trash-outline" size={22} color={colors.danger} />
                </Pressable>
              )
            : undefined,
        }}
      />
      <SafeAreaView
        edges={['bottom']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {isEventError ? <QueryError onRetry={refetchEvent} /> : null}
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 60 }}>
          <EventInfoCard
            title={event.title}
            startDate={event.startDate}
            location={event.location}
            court={event.court}
            isHomeGame={event.isHomeGame}
            team={event.team}
            matchStatus={matchStatus}
          />

          <ResultsSection
            results={results}
            matchStatus={matchStatus}
            canSubmitResult={canSubmitResult}
            canConfirm={canConfirm}
            isCompleted={isCompleted}
            eventId={id!}
            onSubmitResult={(data) => submitResult.mutate(data)}
            onConfirm={() => confirmResult.mutate()}
            onReject={(data) => rejectResult.mutate(data)}
          />

          <AvailabilitySection
            availabilities={availabilities}
            myStatus={myAvailability?.status}
            onSetStatus={(status: 'AVAILABLE' | 'NOT_AVAILABLE' | 'MAYBE') =>
              setAvailability.mutate({ status })
            }
          />

          {/* Lineup */}
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
                onAutoGenerate={() => {
                  if (event.teamId)
                    autoGenerate.mutate(event.teamId, { onSuccess: () => setLineupInit(false) });
                }}
                onConfirm={() => {
                  const teamId = lineupTeamId ?? event.teamId;
                  if (!teamId) return;
                  const allEntries = [
                    ...localStarters.map((e, i) => ({ userId: e.userId, position: i + 1 })),
                    ...localSubs.map((e, i) => ({
                      userId: e.userId,
                      position: i + localStarters.length + 1,
                    })),
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
                }}
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
});
