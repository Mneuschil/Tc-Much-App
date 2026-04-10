import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { differenceInHours } from 'date-fns';
import { useTheme } from '../../theme';
import { useSetTrainingAttendance } from '../../features/training/hooks/useTraining';
import { formatDate, formatTime } from '../../utils/formatDate';
import type { CalendarEvent } from '../../utils/calendarUtils';

const EVENT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  LEAGUE_MATCH: 'tennisball',
  CUP_MATCH: 'trophy',
  CLUB_CHAMPIONSHIP: 'medal',
  RANKING_MATCH: 'stats-chart',
  TRAINING: 'fitness',
  CLUB_EVENT: 'people',
  TOURNAMENT: 'trophy-outline',
};

export type AgendaItemEvent = CalendarEvent & {
  myAttendance?: boolean | null;
};

interface AgendaItemProps {
  event: AgendaItemEvent;
  isTrainer: boolean;
  onShowTrainerOverview: () => void;
}

function toStatus(attending: boolean | null | undefined): 'AVAILABLE' | 'NOT_AVAILABLE' | null {
  if (attending === true) return 'AVAILABLE';
  if (attending === false) return 'NOT_AVAILABLE';
  return null;
}

export function AgendaItem({ event, isTrainer, onShowTrainerOverview }: AgendaItemProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const setTrainingAttendance = useSetTrainingAttendance(event.id);
  const [myAttendance, setMyAttendance] = useState<'AVAILABLE' | 'NOT_AVAILABLE' | null>(() =>
    toStatus(event.myAttendance),
  );

  const isTraining = event.type === 'TRAINING';
  const hoursUntil = differenceInHours(new Date(event.startDate), new Date());
  const deadlineExpired = isTraining && hoursUntil >= 0 && hoursUntil < 5;

  const handleAttendance = (status: 'AVAILABLE' | 'NOT_AVAILABLE') => {
    if (deadlineExpired) return;
    const newStatus = myAttendance === status ? null : status;
    setMyAttendance(newStatus);
    if (newStatus) {
      setTrainingAttendance.mutate(newStatus === 'AVAILABLE');
    }
  };

  return (
    <Pressable
      onPress={() => router.push(`/match/${event.id}` as never)}
      accessibilityLabel={`${event.title}, ${formatDate(event.startDate)}`}
      accessibilityRole="button"
      style={({ pressed }) => [
        {
          backgroundColor: colors.backgroundSecondary,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          marginBottom: spacing.md,
          marginHorizontal: spacing.xl,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.eventRow}>
        <View
          style={[
            styles.eventIcon,
            { backgroundColor: colors.surface, borderRadius: borderRadius.lg },
          ]}
          importantForAccessibility="no"
          accessibilityElementsHidden
        >
          <Ionicons
            name={EVENT_ICONS[event.type] ?? 'calendar'}
            size={20}
            color={colors.textPrimary}
          />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={[typography.bodyMedium, { color: colors.textPrimary }]} numberOfLines={1}>
            {event.title}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
            {formatDate(event.startDate)} · {formatTime(event.startDate)}
          </Text>
        </View>
        {event.isHomeGame !== null && event.isHomeGame !== undefined && (
          <View
            style={[
              styles.chip,
              {
                backgroundColor: event.isHomeGame ? colors.chipActive : colors.chipInactive,
                borderRadius: borderRadius.full,
              },
            ]}
          >
            <Text
              style={[
                typography.captionMedium,
                { color: event.isHomeGame ? colors.textInverse : colors.textSecondary },
              ]}
            >
              {event.isHomeGame ? 'Heim' : 'Ausw.'}
            </Text>
          </View>
        )}
      </View>

      {isTraining && (
        <View style={{ marginTop: spacing.md, marginLeft: 56 }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Pressable
              onPress={() => handleAttendance('AVAILABLE')}
              disabled={deadlineExpired}
              accessibilityLabel="Zusagen"
              accessibilityRole="button"
              accessibilityState={{ selected: myAttendance === 'AVAILABLE' }}
              style={[
                styles.attendBtn,
                {
                  backgroundColor:
                    myAttendance === 'AVAILABLE' ? colors.success : colors.successSurface,
                  borderRadius: 12,
                  opacity: deadlineExpired ? 0.5 : 1,
                },
              ]}
            >
              <Text
                style={[
                  typography.buttonSmall,
                  { color: myAttendance === 'AVAILABLE' ? colors.textInverse : colors.success },
                ]}
              >
                Ja
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleAttendance('NOT_AVAILABLE')}
              disabled={deadlineExpired}
              accessibilityLabel="Absagen"
              accessibilityRole="button"
              accessibilityState={{ selected: myAttendance === 'NOT_AVAILABLE' }}
              style={[
                styles.attendBtn,
                {
                  backgroundColor:
                    myAttendance === 'NOT_AVAILABLE' ? colors.danger : colors.dangerSurface,
                  borderRadius: 12,
                  opacity: deadlineExpired ? 0.5 : 1,
                },
              ]}
            >
              <Text
                style={[
                  typography.buttonSmall,
                  { color: myAttendance === 'NOT_AVAILABLE' ? colors.textInverse : colors.danger },
                ]}
              >
                Nein
              </Text>
            </Pressable>
          </View>
          {deadlineExpired && (
            <Text
              style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.xs }]}
            >
              Anmeldefrist abgelaufen
            </Text>
          )}
          {isTrainer && (
            <Pressable
              onPress={onShowTrainerOverview}
              style={{ marginTop: spacing.sm }}
              accessibilityLabel="Trainer-Übersicht anzeigen"
              accessibilityRole="button"
            >
              <Text style={[typography.bodySmall, { color: colors.accentLight }]}>Übersicht</Text>
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  eventRow: { flexDirection: 'row', alignItems: 'center' },
  eventIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 10, paddingVertical: 4 },
  attendBtn: { height: 48, flex: 1, alignItems: 'center', justifyContent: 'center' },
});
