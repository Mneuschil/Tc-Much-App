import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Pressable,
  Image,
  Modal,
} from 'react-native';
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
  const { colors, typography, spacing, isDark } = useTheme();
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
  const messages = messagesData?.pages?.flatMap((p) => (p as MessagesPage).messages ?? []) ?? [];
  const isOfficialRestricted = channel?.isDefault === true && !isBoard && !isAdmin;

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
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: channel?.name ?? 'Channel',
          headerStyle: { backgroundColor: isDark ? colors.background : colors.accent },
          headerTintColor: isDark ? colors.textPrimary : '#FFFFFF',
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
          <FlatList<ChatMessage>
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isOwn={item.author?.id === currentUserId}
                onReply={setReplyTo}
                onReaction={handleReaction}
                onMediaPress={setViewerImage}
              />
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
            disabled={isOfficialRestricted}
            disabledText="Nur Admins koennen hier posten"
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
            <Ionicons name="close-circle" size={32} color="#FFFFFF" />
          </Pressable>
          {viewerImage && (
            <Image source={{ uri: viewerImage }} style={styles.viewerImage} resizeMode="contain" />
          )}
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
