import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Badge, Avatar } from '../ui';
import { useTrainingAttendance } from '../../features/training/hooks/useTraining';

interface AttendanceEntry {
  user: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  attending: boolean;
}

interface TrainerOverviewModalProps {
  visible: boolean;
  eventId: string | null;
  onClose: () => void;
}

export function TrainerOverviewModal({ visible, eventId, onClose }: TrainerOverviewModalProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { data } = useTrainingAttendance(eventId ?? '');
  const entries = (data ?? []) as AttendanceEntry[];

  const attending = entries.filter((e) => e.attending);
  const notAttending = entries.filter((e) => !e.attending);

  return (
    <Modal
      visible={visible}
      presentationStyle="pageSheet"
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: spacing.xl,
          }}
        >
          <Text style={[typography.h2, { color: colors.textPrimary }]} accessibilityRole="header">
            Trainer-Übersicht
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityLabel="Modal schließen"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: 0 }}>
          <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xxl }}>
            <View
              style={[
                styles.summaryBadge,
                { backgroundColor: colors.successSurface, borderRadius: borderRadius.xl },
              ]}
            >
              <Text style={[typography.h3, { color: colors.success }]}>{attending.length}</Text>
              <Text style={[typography.caption, { color: colors.success }]}>Zusagen</Text>
            </View>
            <View
              style={[
                styles.summaryBadge,
                { backgroundColor: colors.dangerSurface, borderRadius: borderRadius.xl },
              ]}
            >
              <Text style={[typography.h3, { color: colors.danger }]}>{notAttending.length}</Text>
              <Text style={[typography.caption, { color: colors.danger }]}>Absagen</Text>
            </View>
            <View
              style={[
                styles.summaryBadge,
                { backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.xl },
              ]}
            >
              <Text style={[typography.h3, { color: colors.textPrimary }]}>{entries.length}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>Gesamt</Text>
            </View>
          </View>
          {entries.map((entry) => (
            <View
              key={entry.user.id}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm }}
            >
              <Avatar
                firstName={entry.user.firstName}
                lastName={entry.user.lastName}
                imageUrl={entry.user.avatarUrl}
                size="sm"
              />
              <Text
                style={[
                  typography.bodySmall,
                  { color: colors.textPrimary, flex: 1, marginLeft: spacing.md },
                ]}
              >
                {entry.user.firstName} {entry.user.lastName}
              </Text>
              <Badge
                label={entry.attending ? 'Ja' : 'Nein'}
                variant={entry.attending ? 'success' : 'danger'}
              />
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summaryBadge: { flex: 1, alignItems: 'center', padding: 16 },
});
