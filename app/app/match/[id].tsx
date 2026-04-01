import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { Avatar, Badge, Card } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';
import { useEvent } from '../../src/features/calendar/hooks/useEvents';
import { useAvailability, useSetAvailability } from '../../src/features/teams/hooks/useAvailability';
import { useMatchResults, useConfirmResult } from '../../src/features/match/hooks/useMatchResult';
import { formatDate, formatTime } from '../../src/utils/formatDate';
import { formatMatchScore } from '../../src/features/match/utils/tennisScoring';
import { MOCK_EVENTS, MOCK_AVAILABILITIES, MOCK_MATCH_RESULTS } from '../../src/lib/mockData';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const { user } = useAuth();

  const { data: eventData } = useEvent(id!);
  const { data: availData } = useAvailability(id!);
  const setAvailability = useSetAvailability(id!);
  const { data: resultsData } = useMatchResults(id!);
  const confirmResult = useConfirmResult(id!);

  const event = eventData ?? MOCK_EVENTS.find(e => e.id === id) ?? MOCK_EVENTS[0];
  const availabilities = (availData ?? MOCK_AVAILABILITIES) as any[];
  const results = (resultsData ?? (event?.type?.includes('RANKING') ? MOCK_MATCH_RESULTS : [])) as any[];

  const myAvailability = availabilities.find((a: any) => a.user?.id === user?.id);
  const available = availabilities.filter((a: any) => a.status === 'AVAILABLE');
  const unavailable = availabilities.filter((a: any) => a.status === 'NOT_AVAILABLE');

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: event.title, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.textPrimary, headerShadowVisible: false }} />
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 60 }}>
          <Card variant="elevated">
            {event.team && <Text style={[typography.captionMedium, { color: colors.textSecondary }]}>{event.team.name}</Text>}
            <Text style={[typography.h2, { color: colors.textPrimary, marginTop: spacing.xs }]}>{event.title}</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: spacing.md }}>
              {event.isHomeGame !== null && event.isHomeGame !== undefined && (
                <Badge label={event.isHomeGame ? 'Heim' : 'Auswaerts'} variant={event.isHomeGame ? 'dark' : 'neutral'} />
              )}
            </View>
            <View style={[styles.infoRow, { marginTop: spacing.xl }]}>
              <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
              <Text style={[typography.body, { color: colors.textPrimary, marginLeft: spacing.sm }]}>{formatDate(event.startDate)} · {formatTime(event.startDate)}</Text>
            </View>
            {event.location && (
              <View style={[styles.infoRow, { marginTop: spacing.sm }]}>
                <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
                <Text style={[typography.body, { color: colors.textPrimary, marginLeft: spacing.sm }]}>{event.location}</Text>
              </View>
            )}
            {event.court && (
              <View style={[styles.infoRow, { marginTop: spacing.sm }]}>
                <Ionicons name="grid-outline" size={18} color={colors.textSecondary} />
                <Text style={[typography.body, { color: colors.textPrimary, marginLeft: spacing.sm }]}>{event.court}</Text>
              </View>
            )}
          </Card>

          {/* Results */}
          {results.length > 0 && (
            <View style={{ marginTop: spacing.xxl }}>
              <Text style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.md }]}>Ergebnisse</Text>
              {results.map((r: any) => (
                <View key={r.id} style={[{ backgroundColor: colors.cardBackground, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.sm, ...shadows.sm }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[typography.h3, { color: colors.textPrimary }]}>{formatMatchScore(r.sets)}</Text>
                    <Badge label={r.status === 'CONFIRMED' ? 'Bestaetigt' : r.status === 'SUBMITTED' ? 'Offen' : r.status} variant={r.status === 'CONFIRMED' ? 'success' : 'warning'} />
                  </View>
                  {r.winner && <Text style={[typography.caption, { color: colors.success, marginTop: spacing.sm }]}>Gewinner: {r.winner.firstName} {r.winner.lastName}</Text>}
                  <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>Eingereicht von: {r.submittedBy.firstName} {r.submittedBy.lastName}</Text>
                  {r.status === 'SUBMITTED' && r.submittedById !== user?.id && (
                    <Pressable onPress={() => confirmResult.mutate(r.id)} style={[{ backgroundColor: colors.chipActive, borderRadius: borderRadius.lg, padding: spacing.md, marginTop: spacing.md, alignItems: 'center' }]}>
                      <Text style={[typography.buttonSmall, { color: '#FFFFFF' }]}>Ergebnis bestaetigen</Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Availability */}
          <View style={{ marginTop: spacing.xxl }}>
            <Text style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.md }]}>Verfuegbarkeit</Text>
            <View style={styles.availButtons}>
              {(['AVAILABLE', 'NOT_AVAILABLE'] as const).map((status) => {
                const isSelected = myAvailability?.status === status;
                const isAvail = status === 'AVAILABLE';
                return (
                  <Pressable key={status} onPress={() => setAvailability.mutate({ status })}
                    style={[styles.availButton, { backgroundColor: isSelected ? colors.chipActive : colors.cardBackground, borderRadius: borderRadius.xl, padding: spacing.lg, ...(isSelected ? {} : shadows.sm) }]}>
                    <Ionicons name={isAvail ? 'checkmark-circle' : 'close-circle'} size={28} color={isSelected ? '#FFFFFF' : isAvail ? colors.success : colors.danger} />
                    <Text style={[typography.captionMedium, { color: isSelected ? '#FFFFFF' : colors.textPrimary, marginTop: spacing.xs }]}>
                      {isAvail ? 'Kann spielen' : 'Kann nicht'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {available.length > 0 && (
              <View style={{ marginTop: spacing.lg }}>
                <Text style={[typography.captionMedium, { color: colors.success, marginBottom: spacing.sm }]}>Verfuegbar ({available.length})</Text>
                {available.map((a: any) => (
                  <View key={a.id} style={[styles.personRow, { paddingVertical: spacing.sm }]}>
                    <Avatar firstName={a.user.firstName} lastName={a.user.lastName} size="xs" />
                    <Text style={[typography.bodySmall, { color: colors.textPrimary, marginLeft: spacing.sm }]}>{a.user.firstName} {a.user.lastName}</Text>
                    {a.comment && <Text style={[typography.caption, { color: colors.textTertiary, marginLeft: 'auto' }]}>{a.comment}</Text>}
                  </View>
                ))}
              </View>
            )}
            {unavailable.length > 0 && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={[typography.captionMedium, { color: colors.danger, marginBottom: spacing.sm }]}>Nicht verfuegbar ({unavailable.length})</Text>
                {unavailable.map((a: any) => (
                  <View key={a.id} style={[styles.personRow, { paddingVertical: spacing.sm }]}>
                    <Avatar firstName={a.user.firstName} lastName={a.user.lastName} size="xs" />
                    <Text style={[typography.bodySmall, { color: colors.textPrimary, marginLeft: spacing.sm }]}>{a.user.firstName} {a.user.lastName}</Text>
                    {a.comment && <Text style={[typography.caption, { color: colors.textTertiary, marginLeft: 'auto' }]}>{a.comment}</Text>}
                  </View>
                ))}
              </View>
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
});
