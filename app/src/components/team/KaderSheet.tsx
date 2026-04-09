import { View, Text, StyleSheet, FlatList, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Avatar, EmptyState } from '../ui';

interface MemberData {
  id: string;
  position: number | null;
  user: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
}

interface KaderSheetProps {
  visible: boolean;
  onClose: () => void;
  members: MemberData[];
  teamType: string;
}

export function KaderSheet({ visible, onClose, members, teamType }: KaderSheetProps) {
  const { colors, typography, spacing } = useTheme();
  const showPosition = teamType === 'MATCH_TEAM';

  const sortedMembers = showPosition
    ? [...members].sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
    : members;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <View
          style={[styles.header, { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg }]}
        >
          <Text style={[typography.h2, { color: colors.textPrimary }]}>Mitglieder</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={26} color={colors.textPrimary} />
          </Pressable>
        </View>

        <FlatList
          data={sortedMembers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: spacing.xxxl }}
          ListEmptyComponent={
            <EmptyState title="Keine Mitglieder" description="Noch keine Personen in diesem Team" />
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.memberRow,
                {
                  paddingHorizontal: spacing.xl,
                  paddingVertical: spacing.md,
                  borderBottomColor: colors.separator,
                },
              ]}
            >
              <Avatar
                firstName={item.user.firstName}
                lastName={item.user.lastName}
                imageUrl={item.user.avatarUrl}
                size="md"
              />
              <View style={{ marginLeft: spacing.md, flex: 1 }}>
                <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
                  {item.user.firstName} {item.user.lastName}
                </Text>
              </View>
              {showPosition && item.position && (
                <Text style={[typography.captionMedium, { color: colors.textTertiary }]}>
                  Pos. {item.position}
                </Text>
              )}
            </View>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
