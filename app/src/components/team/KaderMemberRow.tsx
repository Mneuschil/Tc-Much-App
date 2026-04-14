import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TeamMemberWithUser } from '@tennis-club/shared';
import { useTheme } from '../../theme';
import { Avatar } from '../ui';

interface TeamMemberRowProps {
  item: TeamMemberWithUser;
  showPosition: boolean;
  canManage: boolean;
  onRemove: (member: TeamMemberWithUser) => void;
}

export function TeamMemberRow({ item, showPosition, canManage, onRemove }: TeamMemberRowProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View
      style={[
        styles.row,
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
      <View style={styles.info}>
        <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
          {item.user.firstName} {item.user.lastName}
        </Text>
        {showPosition && item.position && (
          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
            Position {item.position}
          </Text>
        )}
      </View>
      {canManage && (
        <Pressable
          onPress={() => onRemove(item)}
          hitSlop={12}
          accessibilityLabel={`${item.user.firstName} ${item.user.lastName} entfernen`}
          accessibilityRole="button"
        >
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  info: { flex: 1, marginLeft: 12 },
});
