import { useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Avatar } from '../ui';
import { formatTime } from '../../utils/formatDate';
import { MessageMediaGrid } from './MessageMediaGrid';
import { MessageReactions } from './MessageReactions';
import type { ReactionType } from '@tennis-club/shared';

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
  const replyHintOpacity = useRef(new Animated.Value(0)).current;

  const triggerReply = useCallback(() => {
    onReply({ id: message.id, content: message.content });
  }, [onReply, message.id, message.content]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 15 && Math.abs(gs.dy) < 15,
      onPanResponderMove: (_, gs) => {
        if (gs.dx > 0) {
          const clamped = Math.min(gs.dx * 0.5, 80);
          translateX.setValue(clamped);
          replyHintOpacity.setValue(gs.dx > 15 ? Math.min((gs.dx - 15) / 40, 1) : 0);
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx > REPLY_THRESHOLD) {
          triggerReply();
        }
        Animated.spring(translateX, {
          toValue: 0,
          damping: 20,
          stiffness: 200,
          mass: 1,
          useNativeDriver: true,
        }).start();
        Animated.timing(replyHintOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  const bubbleBg = isOwn ? (isDark ? '#0B5D34' : colors.accent) : colors.backgroundSecondary;
  const textColor = isOwn ? '#FFFFFF' : colors.textPrimary;
  const metaColor = isOwn ? 'rgba(255,255,255,0.55)' : colors.textTertiary;
  const nameColor = isOwn ? 'rgba(255,255,255,0.85)' : colors.accentLight;

  return (
    <View style={[styles.outerRow, isOwn ? styles.rowOwn : styles.rowOther]}>
      <Animated.View style={[styles.replyHint, { opacity: replyHintOpacity }]}>
        <Ionicons name="arrow-undo" size={18} color={colors.textTertiary} />
      </Animated.View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.row,
          isOwn ? styles.rowOwn : styles.rowOther,
          { transform: [{ translateX }] },
        ]}
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
                <Text style={styles.invisibleSpacer}>
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
              <MessageMediaGrid urls={message.mediaUrls} onMediaPress={onMediaPress} />
              <View style={styles.metaRow}>
                <View style={styles.flex1} />
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
            <MessageReactions
              reactions={message.reactions!}
              messageId={message.id}
              isOwn={isOwn}
              onReaction={onReaction}
            />
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
  invisibleSpacer: { color: 'transparent', fontSize: 11 },
  flex1: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 6 },
  timeLabel: { fontSize: 11 },
  replyHint: { position: 'absolute', left: 8, top: '50%', marginTop: -12, zIndex: -1 },
});
