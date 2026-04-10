import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Avatar } from '../ui';

interface AvailabilityEntry {
  id: string;
  status: string;
  comment: string | null;
  user: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
}

type AvailabilityStatus = 'AVAILABLE' | 'NOT_AVAILABLE' | 'MAYBE';

interface AvailabilitySectionProps {
  availabilities: AvailabilityEntry[];
  myStatus: string | undefined;
  onSetStatus: (status: AvailabilityStatus) => void;
}

const AVAIL_OPTIONS = [
  { status: 'AVAILABLE', label: 'Kann spielen', icon: 'checkmark-circle' as const },
  { status: 'MAYBE', label: 'Unsicher', icon: 'help-circle' as const },
  { status: 'NOT_AVAILABLE', label: 'Kann nicht', icon: 'close-circle' as const },
] as const;

function PersonList({
  entries,
  label,
  color,
}: {
  entries: AvailabilityEntry[];
  label: string;
  color: string;
}) {
  const { colors, typography, spacing } = useTheme();
  if (entries.length === 0) return null;
  return (
    <View style={{ marginTop: spacing.lg }}>
      <Text style={[typography.captionMedium, { color, marginBottom: spacing.sm }]}>
        {label} ({entries.length})
      </Text>
      {entries.map((a) => (
        <View key={a.id} style={[styles.personRow, { paddingVertical: spacing.sm }]}>
          <Avatar firstName={a.user.firstName} lastName={a.user.lastName} size="xs" />
          <Text
            style={[typography.bodySmall, { color: colors.textPrimary, marginLeft: spacing.sm }]}
          >
            {a.user.firstName} {a.user.lastName}
          </Text>
          {a.comment && (
            <Text style={[typography.caption, { color: colors.textTertiary, marginLeft: 'auto' }]}>
              {a.comment}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

export function AvailabilitySection({
  availabilities,
  myStatus,
  onSetStatus,
}: AvailabilitySectionProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const available = availabilities.filter((a) => a.status === 'AVAILABLE');
  const maybe = availabilities.filter((a) => a.status === 'MAYBE');
  const unavailable = availabilities.filter((a) => a.status === 'NOT_AVAILABLE');

  const getIconColor = (status: string) => {
    if (status === 'AVAILABLE') return colors.success;
    if (status === 'MAYBE') return colors.warning;
    return colors.danger;
  };

  return (
    <View style={{ marginTop: spacing.xxl }}>
      <Text style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.md }]}>
        Verfügbarkeit
      </Text>
      <View style={styles.buttons}>
        {AVAIL_OPTIONS.map((opt) => {
          const isSelected = myStatus === opt.status;
          const isMaybe = opt.status === 'MAYBE';
          return (
            <Pressable
              key={opt.status}
              onPress={() => onSetStatus(opt.status)}
              accessibilityLabel={opt.label}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.button,
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
                color={isSelected && !isMaybe ? colors.textInverse : getIconColor(opt.status)}
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
      <PersonList entries={available} label="Verfügbar" color={colors.success} />
      <PersonList entries={maybe} label="Unsicher" color={colors.warning} />
      <PersonList entries={unavailable} label="Nicht verfügbar" color={colors.danger} />
    </View>
  );
}

const styles = StyleSheet.create({
  buttons: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, alignItems: 'center' },
  personRow: { flexDirection: 'row', alignItems: 'center' },
});
