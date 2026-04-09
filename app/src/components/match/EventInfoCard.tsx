import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Badge, Card } from '../ui';
import { formatDate, formatTime } from '../../utils/formatDate';

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
  CONFIRMED: { label: 'Bestaetigt', variant: 'success' },
  REJECTED: { label: 'Abgelehnt', variant: 'danger' },
};

export function MatchStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: 'neutral' as const };
  return <Badge label={config.label} variant={config.variant} />;
}

interface EventInfoCardProps {
  title: string;
  startDate: string;
  location?: string;
  court?: string;
  isHomeGame?: boolean;
  team?: { name: string };
  matchStatus: string;
}

export function EventInfoCard({
  title,
  startDate,
  location,
  court,
  isHomeGame,
  team,
  matchStatus,
}: EventInfoCardProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <Card variant="elevated">
      {team && (
        <Text style={[typography.captionMedium, { color: colors.textSecondary }]}>{team.name}</Text>
      )}
      <Text style={[typography.h2, { color: colors.textPrimary, marginTop: spacing.xs }]}>
        {title}
      </Text>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: spacing.md }}>
        {isHomeGame !== null && isHomeGame !== undefined && (
          <Badge
            label={isHomeGame ? 'Heim' : 'Auswaerts'}
            variant={isHomeGame ? 'dark' : 'neutral'}
          />
        )}
        {matchStatus && <MatchStatusBadge status={matchStatus} />}
      </View>
      <View style={[styles.infoRow, { marginTop: spacing.xl }]}>
        <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
        <Text style={[typography.body, { color: colors.textPrimary, marginLeft: spacing.sm }]}>
          {formatDate(startDate)} · {formatTime(startDate)}
        </Text>
      </View>
      {location && (
        <View style={[styles.infoRow, { marginTop: spacing.sm }]}>
          <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
          <Text style={[typography.body, { color: colors.textPrimary, marginLeft: spacing.sm }]}>
            {location}
          </Text>
        </View>
      )}
      {court && (
        <View style={[styles.infoRow, { marginTop: spacing.sm }]}>
          <Ionicons name="grid-outline" size={18} color={colors.textSecondary} />
          <Text style={[typography.body, { color: colors.textPrimary, marginLeft: spacing.sm }]}>
            {court}
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  infoRow: { flexDirection: 'row', alignItems: 'center' },
});
