import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme';
import { formatTime } from '../../utils/formatDate';
import { getEventColor, type CalendarEvent } from '../../utils/calendarUtils';

export type DayEvent = CalendarEvent & {
  team: { id: string; name: string } | null;
};

interface DayAgendaProps {
  events: DayEvent[];
}

export function DayAgenda({ events }: DayAgendaProps) {
  const { colors, typography } = useTheme();
  const router = useRouter();

  const sorted = [...events].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  if (sorted.length === 0) {
    return (
      <View style={styles.emptyRow}>
        <Text style={[typography.bodySmall, { color: colors.textTertiary }]}>Keine Termine</Text>
      </View>
    );
  }

  return (
    <View>
      {sorted.map((event, index) => {
        const accent = getEventColor(event.type, colors);
        const time = formatTime(event.startDate);
        const endTime = event.endDate ? formatTime(event.endDate) : null;

        return (
          <View key={event.id}>
            {index > 0 && (
              <View style={[styles.separator, { backgroundColor: colors.separator }]} />
            )}
            <Pressable
              onPress={() => router.push(`/match/${event.id}` as never)}
              style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
            >
              {/* Accent bar */}
              <View style={[styles.accentBar, { backgroundColor: accent }]} />

              {/* Title + subtitle */}
              <View style={styles.textColumn}>
                <Text
                  style={[typography.bodyMedium, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {event.title}
                </Text>
                {(event.court ?? event.location) && (
                  <Text
                    style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}
                    numberOfLines={1}
                  >
                    {event.court ? `Platz ${event.court}` : event.location}
                  </Text>
                )}
              </View>

              {/* Time column */}
              <View style={styles.timeColumn}>
                <Text style={[typography.bodySmall, { color: colors.textPrimary }]}>{time}</Text>
                {endTime && (
                  <Text
                    style={[typography.bodySmall, { color: colors.textTertiary, marginTop: 1 }]}
                  >
                    {endTime}
                  </Text>
                )}
              </View>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyRow: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: 4,
  },
  accentBar: {
    width: 3.5,
    borderRadius: 2,
    alignSelf: 'stretch',
    marginRight: 12,
  },
  textColumn: {
    flex: 1,
    marginRight: 12,
  },
  timeColumn: {
    alignItems: 'flex-end',
  },
});
