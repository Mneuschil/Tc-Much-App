import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Pressable,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { QueryError } from '../../src/components/ui';
import { MessageBubble, ChatInputBar } from '../../src/components/chat';
import type { ChatMessage } from '../../src/components/chat';
import { useAuthStore } from '../../src/stores/authStore';
import { usePermissions } from '../../src/hooks/usePermissions';
import { useChannel } from '../../src/features/chat/hooks/useChannels';
import {
  useMessages,
  useSendMessage,
  useAddReaction,
} from '../../src/features/chat/hooks/useMessages';
import { formatChatDate } from '../../src/utils/formatDate';
import type { ReactionType } from '@tennis-club/shared';

interface ChannelData {
  id: string;
  name: string;
  visibility: string;
  isDefault: boolean;
}

interface MessagesPage {
  messages: ChatMessage[];
  nextCursor: string | null;
  hasMore: boolean;
}

export default function ChannelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing, borderRadius, isDark } = useTheme();
  const { isBoard, isAdmin } = usePermissions();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; content: string } | null>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const { data: channelData } = useChannel(id!);
  const { data: messagesData, isLoading, isError, refetch, fetchNextPage } = useMessages(id!);
  const sendMessage = useSendMessage(id!);
  const addReaction = useAddReaction(id!);

  const channel = channelData as ChannelData | undefined;
  const messages = useMemo(
    () => messagesData?.pages?.flatMap((p) => (p as MessagesPage).messages ?? []) ?? [],
    [messagesData],
  );
  const isOfficialRestricted = channel?.isDefault === true && !isBoard && !isAdmin;

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

  const handleReaction = useCallback(
    (messageId: string, type: ReactionType) => {
      addReaction.mutate({ messageId, type });
    },
    [addReaction],
  );

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => (
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
          onMediaPress={setViewerImage}
        />
      </>
    ),
    [dateHeaders, currentUserId, handleReaction, colors, borderRadius, typography],
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: channel?.name ?? 'Channel',
          headerStyle: { backgroundColor: isDark ? colors.background : colors.accent },
          headerTintColor: isDark ? colors.textPrimary : colors.buttonPrimaryText,
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView
        edges={['bottom']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={100}
        >
          <FlashList<ChatMessage>
            data={messages}
            maintainVisibleContentPosition={{
              startRenderingFromBottom: true,
              autoscrollToBottomThreshold: 50,
            }}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            getItemType={(item) => (item.author?.id === currentUserId ? 'own' : 'other')}
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
          />

          <ChatInputBar
            value={newMessage}
            onChangeText={setNewMessage}
            onSend={handleSend}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            disabled={isOfficialRestricted}
            disabledText="Nur Admins können hier posten"
          />
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal
        visible={viewerImage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerImage(null)}
      >
        <Pressable style={styles.viewerOverlay} onPress={() => setViewerImage(null)}>
          <Pressable onPress={() => setViewerImage(null)} style={styles.viewerClose}>
            <Ionicons name="close-circle" size={32} color={colors.buttonPrimaryText} />
          </Pressable>
          {viewerImage && (
            <Image
              source={{ uri: viewerImage }}
              style={styles.viewerImage}
              contentFit="contain"
              transition={200}
              cachePolicy="memory-disk"
            />
          )}
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dateBadgeRow: { alignItems: 'center', marginVertical: 12 },
  dateBadge: { paddingHorizontal: 14, paddingVertical: 5 },
  emptyWrap: { paddingTop: 60, alignItems: 'center' },
  viewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerClose: { position: 'absolute', top: 60, right: 20, zIndex: 1 },
  viewerImage: { width: '90%', height: '70%' },
});
