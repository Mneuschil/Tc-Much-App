import { Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Avatar } from '../ui';

interface ClubMember {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

interface KaderAddMemberRowProps {
  item: ClubMember;
  onSelect: (userId: string) => void;
}

export function KaderAddMemberRow({ item, onSelect }: KaderAddMemberRowProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <Pressable
      onPress={() => onSelect(item.id)}
      accessibilityLabel={`${item.firstName} ${item.lastName} hinzufügen`}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        {
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
          borderBottomColor: colors.separator,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Avatar
        firstName={item.firstName}
        lastName={item.lastName}
        imageUrl={item.avatarUrl}
        size="md"
      />
      <Text
        style={[
          typography.bodyMedium,
          { color: colors.textPrimary, flex: 1, marginLeft: spacing.md },
        ]}
      >
        {item.firstName} {item.lastName}
      </Text>
      <Ionicons name="add-circle-outline" size={22} color={colors.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
