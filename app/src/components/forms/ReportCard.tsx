import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Badge } from '../ui/Badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Urgency, type FormSubmission, type FormSubmissionStatus, type CourtDamageData } from '@tennis-club/shared';

const URGENCY_VARIANT: Record<Urgency, 'neutral' | 'warning' | 'danger'> = {
  [Urgency.LOW]: 'neutral',
  [Urgency.MEDIUM]: 'warning',
  [Urgency.HIGH]: 'danger',
};

const URGENCY_LABEL: Record<Urgency, string> = {
  [Urgency.LOW]: 'Niedrig',
  [Urgency.MEDIUM]: 'Mittel',
  [Urgency.HIGH]: 'Hoch',
};

const STATUS_CONFIG: Record<FormSubmissionStatus, { variant: 'warning' | 'accent' | 'success'; label: string }> = {
  submitted: { variant: 'warning', label: 'Offen' },
  in_progress: { variant: 'accent', label: 'In Bearbeitung' },
  resolved: { variant: 'success', label: 'Erledigt' },
};

interface ReportCardProps {
  report: FormSubmission;
}

export function ReportCard({ report }: ReportCardProps) {
  const { colors, spacing, radii, typography } = useTheme();
  const data = report.data as CourtDamageData;
  const statusCfg = STATUS_CONFIG[report.status];
  const urgencyVariant = URGENCY_VARIANT[data.urgency];

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderRadius: radii.md, padding: spacing.md }]}>
      <View style={styles.header}>
        <Text style={[typography.h3, { color: colors.textPrimary, flex: 1 }]}>Platz {data.courtNumber}</Text>
        <Badge label={URGENCY_LABEL[data.urgency]} variant={urgencyVariant} size="sm" />
      </View>

      <Text
        numberOfLines={2}
        style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}
      >
        {data.description}
      </Text>

      <View style={[styles.footer, { marginTop: spacing.sm }]}>
        <Badge label={statusCfg.label} variant={statusCfg.variant} size="sm" />
        <Text style={[typography.caption, { color: colors.textTertiary }]}>
          {format(new Date(report.createdAt), 'dd. MMM yyyy', { locale: de })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
