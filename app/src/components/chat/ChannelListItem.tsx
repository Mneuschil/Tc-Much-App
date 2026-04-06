import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { formatTimeAgo } from '../../utils/formatDate';

interface LastMessage {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
}

export interface ChannelItem {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  isDefault: boolean;
  subchannels: Array<{ id: string; name: string }>;
  _count: { messages: number; members: number };
  lastMessage: LastMessage | null;
}

interface ChannelListItemProps {
  item: ChannelItem;
  onPress: (id: string) => void;
}

function getChannelInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function ChannelListItem({ item, onPress }: ChannelListItemProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const isOfficial = item.isDefault && item.visibility === 'PUBLIC';
  const isRestricted = item.visibility === 'RESTRICTED';

  return (
    <Pressable
      onPress={() => onPress(item.id)}
      style={({ pressed }) => [
        styles.row,
        { opacity: pressed ? 0.7 : 1, paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
      ]}
    >
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: isOfficial
              ? colors.accent
              : isRestricted
                ? colors.backgroundTertiary
                : colors.accentSurface,
            borderRadius: borderRadius.full,
          },
        ]}
      >
        {isRestricted ? (
          <Ionicons
            name="lock-closed"
            size={18}
            color={isOfficial ? colors.textInverse : colors.textSecondary}
          />
        ) : (
          <Text
            style={[styles.avatarText, { color: isOfficial ? colors.textInverse : colors.accent }]}
          >
            {getChannelInitial(item.name)}
          </Text>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text
            style={[typography.bodyMedium, { color: colors.textPrimary, flex: 1 }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text
            style={[typography.caption, { color: colors.textTertiary, marginLeft: spacing.sm }]}
          >
            {item.lastMessage ? formatTimeAgo(item.lastMessage.createdAt) : ''}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <Text
            style={[typography.bodySmall, { color: colors.textSecondary, flex: 1 }]}
            numberOfLines={1}
          >
            {item.lastMessage
              ? `${item.lastMessage.author?.firstName ?? ''}: ${item.lastMessage.content}`
              : (item.description ?? `${item._count?.messages ?? 0} Nachrichten`)}
          </Text>
          {isOfficial && (
            <View style={[styles.officialDot, { backgroundColor: colors.accentLight }]} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: { fontSize: 20, fontWeight: '700' },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  bottomRow: { flexDirection: 'row', alignItems: 'center' },
  officialDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
});
