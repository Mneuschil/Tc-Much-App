import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../theme';
import { EmptyState, QueryError } from '../ui';
import { MessageBubble, ChatInputBar } from '../chat';
import type { ChatMessage } from '../chat';
import { useAuthStore } from '../../stores/authStore';
import { useMessages, useSendMessage, useAddReaction } from '../../features/chat/hooks/useMessages';
import { formatChatDate } from '../../utils/formatDate';
import type { ReactionType } from '@tennis-club/shared';

interface MessagesPage {
  messages: ChatMessage[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface TeamChatTabProps {
  channelId: string | undefined | null;
}

export function TeamChatTab({ channelId }: TeamChatTabProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; content: string } | null>(null);

  const {
    data: messagesData,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
  } = useMessages(channelId ?? '');
  const sendMessage = useSendMessage(channelId ?? '');
  const addReaction = useAddReaction(channelId ?? '');

  const messages = useMemo(
    () => messagesData?.pages?.flatMap((p) => (p as MessagesPage).messages ?? []) ?? [],
    [messagesData],
  );

  const dateHeaders = useMemo(() => {
    const headers = new Map<string, string>();
    let lastKey = '';
    for (const msg of messages) {
      const key = new Date(msg.createdAt).toDateString();
      if (key !== lastKey) {
        headers.set(msg.id, msg.createdAt);
        lastKey = key;
      }
    }
    return headers;
  }, [messages]);

  if (!channelId) {
    return (
      <EmptyState
        title="Kein Chat verknüpft"
        description="Für dieses Team wurde noch kein Chat-Kanal angelegt."
      />
    );
  }

  const handleSend = () => {
    const content = newMessage.trim();
    if (!content) return;
    sendMessage.mutate(
      { content, replyToId: replyTo?.id },
      {
        onSuccess: () => {
          setNewMessage('');
          setReplyTo(null);
        },
      },
    );
  };

  const handleReaction = (messageId: string, type: ReactionType) => {
    addReaction.mutate({ messageId, type });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={120}
    >
      <FlatList<ChatMessage>
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <>
            {dateHeaders.has(item.id) && (
              <View style={styles.dateBadgeRow}>
                <View
                  style={[
                    styles.dateBadge,
                    {
                      backgroundColor: colors.backgroundTertiary,
                      borderRadius: borderRadius.full,
                    },
                  ]}
                >
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>
                    {formatChatDate(dateHeaders.get(item.id)!)}
                  </Text>
                </View>
              </View>
            )}
            <MessageBubble
              message={item}
              isOwn={item.author?.id === currentUserId}
              onReply={setReplyTo}
              onReaction={handleReaction}
              onMediaPress={() => {}}
            />
          </>
        )}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.sm,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => refetch()}
            tintColor={colors.accent}
          />
        }
        onEndReached={() => fetchNextPage()}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !isLoading ? (
            isError ? (
              <QueryError onRetry={refetch} />
            ) : (
              <View style={styles.emptyWrap}>
                <Text style={[typography.body, { color: colors.textTertiary }]}>
                  Noch keine Nachrichten
                </Text>
              </View>
            )
          ) : null
        }
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={5}
      />

      <ChatInputBar
        value={newMessage}
        onChangeText={setNewMessage}
        onSend={handleSend}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  dateBadgeRow: { alignItems: 'center', marginVertical: 12 },
  dateBadge: { paddingHorizontal: 14, paddingVertical: 5 },
  emptyWrap: { paddingTop: 60, alignItems: 'center' },
});
