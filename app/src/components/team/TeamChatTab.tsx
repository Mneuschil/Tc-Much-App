import { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '../../theme';
import { EmptyState, QueryError, LoadingSkeleton } from '../ui';
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
  isCreatingChannel?: boolean;
}

export function TeamChatTab({ channelId, isCreatingChannel }: TeamChatTabProps) {
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
    for (let i = 0; i < messages.length; i++) {
      const key = new Date(messages[i].createdAt).toDateString();
      const nextKey =
        i + 1 < messages.length ? new Date(messages[i + 1].createdAt).toDateString() : null;
      if (key !== nextKey) {
        headers.set(messages[i].id, messages[i].createdAt);
      }
    }
    return headers;
  }, [messages]);

  const handleReaction = useCallback(
    (messageId: string, type: ReactionType) => {
      addReaction.mutate({ messageId, type });
    },
    [addReaction],
  );

  const renderChatMessage = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <>
        <MessageBubble
          message={item}
          isOwn={item.author?.id === currentUserId}
          onReply={setReplyTo}
          onReaction={handleReaction}
          onMediaPress={() => {}}
        />
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
      </>
    ),
    [currentUserId, handleReaction, dateHeaders, colors, borderRadius, typography],
  );

  if (!channelId) {
    if (isCreatingChannel) {
      return (
        <View style={styles.emptyWrap}>
          <LoadingSkeleton width={200} height={20} />
        </View>
      );
    }
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

  return (
    <View style={{ flex: 1 }}>
      <FlashList<ChatMessage>
        data={messages}
        maintainVisibleContentPosition={{
          startRenderingFromBottom: true,
          autoscrollToBottomThreshold: 50,
        }}
        keyExtractor={(item) => item.id}
        getItemType={(item) => (dateHeaders.has(item.id) ? 'message-with-date' : 'message')}
        renderItem={renderChatMessage}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.md,
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
      />

      <ChatInputBar
        value={newMessage}
        onChangeText={setNewMessage}
        onSend={handleSend}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dateBadgeRow: { alignItems: 'center', marginVertical: 12 },
  dateBadge: { paddingHorizontal: 14, paddingVertical: 5 },
  emptyWrap: { paddingTop: 60, alignItems: 'center' },
});
