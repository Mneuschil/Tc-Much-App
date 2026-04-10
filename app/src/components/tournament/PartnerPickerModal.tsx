import { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Avatar, EmptyState } from '../ui';
import { useTeams } from '../../features/teams/hooks/useTeams';

interface PartnerPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (partnerId: string) => void;
}

export function PartnerPickerModal({ visible, onClose, onSelect }: PartnerPickerModalProps) {
  const { colors, typography, spacing } = useTheme();
  const { data: teams } = useTeams();
  const members = useMemo(() => {
    const allMembers: Array<{ id: string; firstName: string; lastName: string }> = [];
    const seen = new Set<string>();
    for (const team of (teams ?? []) as Array<{
      members?: Array<{ user: { id: string; firstName: string; lastName: string } }>;
    }>) {
      for (const member of team.members ?? []) {
        if (member.user && !seen.has(member.user.id)) {
          seen.add(member.user.id);
          allMembers.push(member.user);
        }
      }
    }
    return allMembers;
  }, [teams]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.lg,
          }}
        >
          <Text style={[typography.h2, { color: colors.textPrimary }]}>Partner waehlen</Text>
          <Pressable
            onPress={onClose}
            accessibilityLabel="Modal schließen"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.xl }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onSelect(item.id)}
              accessibilityLabel={`${item.firstName} ${item.lastName} als Partner wählen`}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.participantRow,
                {
                  paddingVertical: spacing.md,
                  borderBottomColor: colors.separator,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Avatar firstName={item.firstName} lastName={item.lastName} size="sm" />
              <Text
                style={[
                  typography.bodyMedium,
                  { color: colors.textPrimary, flex: 1, marginLeft: spacing.md },
                ]}
              >
                {item.firstName} {item.lastName}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState title="Keine Mitglieder" description="Keine Vereinsmitglieder gefunden" />
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
