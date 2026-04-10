import { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, PanResponder } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Avatar } from '../ui';
import { formatTime } from '../../utils/formatDate';
import type { ReactionType } from '@tennis-club/shared';

const REACTION_EMOJIS: Record<string, string> = {
  THUMBS_UP: '\uD83D\uDC4D',
  HEART: '\u2764\uFE0F',
  CELEBRATE: '\uD83C\uDF89',
  THINKING: '\uD83E\uDD14',
};

const REPLY_THRESHOLD = 60;

interface MessageAuthor {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  mediaUrls?: string[];
  author?: MessageAuthor;
  replyTo?: { id: string; content: string } | null;
  reactions?: { type: string; userId: string }[];
}

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  onReply: (msg: { id: string; content: string }) => void;
  onReaction: (messageId: string, type: ReactionType) => void;
  onMediaPress: (url: string) => void;
}

export function MessageBubble({
  message,
  isOwn,
  onReply,
  onReaction,
  onMediaPress,
}: MessageBubbleProps) {
  const { colors, typography, spacing, borderRadius, isDark } = useTheme();

  const translateX = useRef(new Animated.Value(0)).current;
  const replyTriggered = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, gs) => Math.abs(gs.dx) > 15 && Math.abs(gs.dy) < 15,
      onPanResponderMove: (_e, gs) => {
        if (gs.dx > 0) {
          translateX.setValue(Math.min(gs.dx * 0.5, 80));
          replyTriggered.current = gs.dx > REPLY_THRESHOLD;
        }
      },
      onPanResponderRelease: () => {
        if (replyTriggered.current) {
          onReply({ id: message.id, content: message.content });
        }
        replyTriggered.current = false;
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
          mass: 1,
        }).start();
      },
    }),
  ).current;

  const bubbleBg = isOwn
    ? isDark
      ? '#0B5D34'
      : colors.accent
    : isDark
      ? colors.backgroundSecondary
      : colors.backgroundSecondary;
  const textColor = isOwn ? '#FFFFFF' : colors.textPrimary;
  const metaColor = isOwn ? 'rgba(255,255,255,0.55)' : colors.textTertiary;
  const nameColor = isOwn ? 'rgba(255,255,255,0.85)' : colors.accentLight;

  const replyIconOpacity = translateX.interpolate({
    inputRange: [0, 15, 55],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const mediaGrid = (urls: string[]) => {
    if (urls.length === 1) {
      return (
        <Pressable
          onPress={() => onMediaPress(urls[0])}
          style={{ marginTop: spacing.xs }}
          accessibilityLabel="Bild ansehen"
          accessibilityRole="button"
        >
          <Image
            source={{ uri: urls[0] }}
            style={[styles.singleMedia, { borderRadius: borderRadius.md }]}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            accessibilityElementsHidden
          />
        </Pressable>
      );
    }
    const visible = urls.slice(0, 4);
    const extra = urls.length - 4;
    return (
      <View style={[styles.mediaGrid, { gap: 3, marginTop: spacing.xs }]}>
        {visible.map((url, idx) => (
          <Pressable
            key={idx}
            onPress={() => onMediaPress(url)}
            style={styles.mediaItem}
            accessibilityLabel={`Bild ${idx + 1} ansehen`}
            accessibilityRole="button"
          >
            <Image
              source={{ uri: url }}
              style={[styles.gridImage, { borderRadius: borderRadius.sm }]}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              recyclingKey={`media-${idx}`}
              accessibilityElementsHidden
            />
            {idx === 3 && extra > 0 && (
              <View style={[styles.mediaOverlay, { borderRadius: borderRadius.sm }]}>
                <Text style={styles.mediaOverlayText}>+{extra}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.outerRow, isOwn ? styles.rowOwn : styles.rowOther]}>
      <Animated.View style={[styles.replyHint, { opacity: replyIconOpacity }]}>
        <Ionicons name="arrow-undo" size={18} color={colors.textTertiary} />
      </Animated.View>

      <Animated.View
        style={[
          styles.row,
          isOwn ? styles.rowOwn : styles.rowOther,
          { transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        {!isOwn && (
          <Avatar
            firstName={message.author?.firstName ?? '?'}
            lastName={message.author?.lastName ?? ''}
            imageUrl={message.author?.avatarUrl}
            size="sm"
          />
        )}
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: bubbleBg,
              borderRadius: borderRadius.xl,
              padding: spacing.md,
              maxWidth: '78%',
              borderTopLeftRadius: isOwn ? borderRadius.xl : spacing.xs,
              borderTopRightRadius: isOwn ? spacing.xs : borderRadius.xl,
            },
          ]}
        >
          {!isOwn && (
            <Text
              style={[typography.caption, { color: nameColor, fontWeight: '600', marginBottom: 2 }]}
            >
              {message.author?.firstName ?? 'Unbekannt'} {message.author?.lastName ?? ''}
            </Text>
          )}

          {message.replyTo && (
            <View
              style={[
                styles.replyBar,
                {
                  backgroundColor: isOwn ? 'rgba(255,255,255,0.15)' : colors.backgroundTertiary,
                  borderLeftColor: colors.accentLight,
                  borderRadius: borderRadius.sm,
                  padding: spacing.xs,
                  marginBottom: spacing.xs,
                },
              ]}
            >
              <Text style={[typography.caption, { color: metaColor }]} numberOfLines={1}>
                {message.replyTo.content}
              </Text>
            </View>
          )}

          {message.content ? (
            <View>
              <Text style={[typography.body, { color: textColor }]}>
                {message.content}
                {/* Invisible spacer to reserve room for the time label */}
                <Text style={{ color: 'transparent', fontSize: 11 }}>
                  {'  ' + formatTime(message.createdAt) + ' '}
                </Text>
              </Text>
              <Text style={[styles.inlineTime, { color: metaColor }]}>
                {formatTime(message.createdAt)}
              </Text>
            </View>
          ) : null}

          {message.mediaUrls && message.mediaUrls.length > 0 && (
            <>
              {mediaGrid(message.mediaUrls)}
              <View style={styles.metaRow}>
                <View style={{ flex: 1 }} />
                <Text style={[styles.timeLabel, { color: metaColor }]}>
                  {formatTime(message.createdAt)}
                </Text>
              </View>
            </>
          )}

          {!message.content && (!message.mediaUrls || message.mediaUrls.length === 0) && (
            <Text style={[styles.timeLabel, { color: metaColor }]}>
              {formatTime(message.createdAt)}
            </Text>
          )}

          {(message.reactions?.length ?? 0) > 0 && (
            <View style={[styles.reactionsRow, { marginTop: 3 }]}>
              {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => {
                const count = message.reactions?.filter((r) => r.type === type).length ?? 0;
                if (count === 0) return null;
                return (
                  <Pressable
                    key={type}
                    onPress={() => onReaction(message.id, type as ReactionType)}
                    accessibilityLabel={`Reaktion ${emoji}`}
                    accessibilityRole="button"
                    style={[
                      styles.reactionChip,
                      {
                        backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : colors.surface,
                        borderRadius: borderRadius.full,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 12 }}>{emoji}</Text>
                    <Text
                      style={[
                        styles.reactionCount,
                        { color: isOwn ? 'rgba(255,255,255,0.8)' : colors.textSecondary },
                      ]}
                    >
                      {count}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerRow: { position: 'relative', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  rowOwn: { justifyContent: 'flex-end' },
  rowOther: { justifyContent: 'flex-start' },
  bubble: {},
  replyBar: { borderLeftWidth: 3 },
  inlineTime: { position: 'absolute', bottom: 0, right: 0, fontSize: 11 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 6 },
  reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  reactionCount: { fontSize: 11, fontWeight: '600', marginLeft: 2 },
  timeLabel: { fontSize: 11 },
  replyHint: { position: 'absolute', left: 8, top: '50%', marginTop: -12, zIndex: -1 },
  singleMedia: { width: '100%', height: 180 },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  mediaItem: { width: '48.5%', height: 100 },
  gridImage: { width: '100%', height: '100%' },
  mediaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaOverlayText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
