import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import type { ReactionType } from '@tennis-club/shared';

const REACTION_EMOJIS: Record<string, string> = {
  THUMBS_UP: '\uD83D\uDC4D',
  HEART: '\u2764\uFE0F',
  CELEBRATE: '\uD83C\uDF89',
  THINKING: '\uD83E\uDD14',
};

interface Reaction {
  type: string;
  userId: string;
}

interface MessageReactionsProps {
  reactions: Reaction[];
  messageId: string;
  isOwn: boolean;
  onReaction: (messageId: string, type: ReactionType) => void;
}

export function MessageReactions({
  reactions,
  messageId,
  isOwn,
  onReaction,
}: MessageReactionsProps) {
  const { colors, borderRadius } = useTheme();

  return (
    <View style={[styles.row, { marginTop: 3 }]}>
      {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => {
        const count = reactions.filter((r) => r.type === type).length;
        if (count === 0) return null;
        return (
          <Pressable
            key={type}
            onPress={() => onReaction(messageId, type as ReactionType)}
            accessibilityLabel={`Reaktion ${emoji}`}
            accessibilityRole="button"
            style={[
              styles.chip,
              {
                backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : colors.surface,
                borderRadius: borderRadius.full,
              },
            ]}
          >
            <Text style={styles.emoji}>{emoji}</Text>
            <Text
              style={[
                styles.count,
                { color: isOwn ? 'rgba(255,255,255,0.8)' : colors.textSecondary },
              ]}
            >
              {count}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  emoji: { fontSize: 12 },
  count: { fontSize: 11, fontWeight: '600', marginLeft: 2 },
});
