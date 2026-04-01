import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform, RefreshControl, Image, Modal } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { Avatar } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';
import { usePermissions } from '../../src/hooks/usePermissions';
import { useChannel } from '../../src/features/chat/hooks/useChannels';
import { useMessages, useSendMessage, useAddReaction } from '../../src/features/chat/hooks/useMessages';
import { formatTimeAgo } from '../../src/utils/formatDate';
import { MOCK_MESSAGES, MOCK_CHANNELS } from '../../src/lib/mockData';
import type { ReactionType } from '@tennis-club/shared';

interface MessageAuthor {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  mediaUrls?: string[];
  author?: MessageAuthor;
  replyTo?: { id: string; content: string } | null;
  reactions?: { type: string; userId: string }[];
}

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

const REACTION_EMOJIS: Record<string, string> = { THUMBS_UP: '\uD83D\uDC4D', HEART: '\u2764\uFE0F', CELEBRATE: '\uD83C\uDF89', THINKING: '\uD83E\uDD14' };

export default function ChannelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const { user } = useAuth();
  const { isBoard, isAdmin } = usePermissions();
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; content: string } | null>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const { data: channelData } = useChannel(id!);
  const { data: messagesData, isLoading, refetch, fetchNextPage } = useMessages(id!);
  const sendMessage = useSendMessage(id!);
  const addReaction = useAddReaction(id!);

  const channel = (channelData ?? MOCK_CHANNELS.find(c => c.id === id)) as ChannelData | undefined;
  const apiMessages = messagesData?.pages?.flatMap((p) => (p as MessagesPage).messages ?? []) ?? [];
  const messages = apiMessages.length > 0 ? apiMessages : MOCK_MESSAGES;

  const isOfficialRestricted = channel?.isDefault === true && !isBoard && !isAdmin;

  const handleSend = () => {
    const content = newMessage.trim();
    if (!content) return;
    sendMessage.mutate({ content, replyToId: replyTo?.id }, { onSuccess: () => { setNewMessage(''); setReplyTo(null); } });
  };

  const renderMediaGrid = (mediaUrls: string[]) => {
    if (mediaUrls.length === 0) return null;
    if (mediaUrls.length === 1) {
      return (
        <Pressable onPress={() => setViewerImage(mediaUrls[0])} style={{ marginTop: spacing.sm }}>
          <Image source={{ uri: mediaUrls[0] }} style={{ width: '100%', height: 200, borderRadius: borderRadius.md }} resizeMode="cover" />
        </Pressable>
      );
    }
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm }}>
        {mediaUrls.map((url, idx) => (
          <Pressable key={idx} onPress={() => setViewerImage(url)} style={{ width: '48%' }}>
            <Image source={{ uri: url }} style={{ width: '100%', height: 120, borderRadius: borderRadius.md }} resizeMode="cover" />
          </Pressable>
        ))}
      </View>
    );
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.msgCard, { backgroundColor: colors.cardBackground, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.sm, ...shadows.sm }]}>
      {item.replyTo && (
        <View style={[styles.replyPreview, { borderLeftColor: colors.accent, backgroundColor: colors.surface, borderRadius: borderRadius.sm, padding: spacing.sm, marginBottom: spacing.sm }]}>
          <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>{item.replyTo.content}</Text>
        </View>
      )}
      <View style={styles.msgHeader}>
        <Avatar firstName={item.author?.firstName ?? '?'} lastName={item.author?.lastName ?? ''} imageUrl={item.author?.avatarUrl} size="sm" />
        <View style={{ marginLeft: spacing.sm, flex: 1 }}>
          <Text style={[typography.bodyMedium, { color: colors.textPrimary, fontSize: 14 }]}>{item.author?.firstName ?? 'Unbekannt'} {item.author?.lastName ?? ''}</Text>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>{formatTimeAgo(item.createdAt)}</Text>
        </View>
        <Pressable onPress={() => setReplyTo({ id: item.id, content: item.content })} hitSlop={8}>
          <Ionicons name="arrow-undo-outline" size={16} color={colors.textTertiary} />
        </Pressable>
      </View>
      <Text style={[typography.body, { color: colors.textPrimary, marginTop: spacing.sm }]}>{item.content}</Text>
      {item.mediaUrls && item.mediaUrls.length > 0 && renderMediaGrid(item.mediaUrls)}
      {(item.reactions?.length ?? 0) > 0 && (
        <View style={styles.reactionsRow}>
          {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => {
            const count = item.reactions?.filter((r) => r.type === type).length ?? 0;
            if (count === 0) return null;
            return (
              <Pressable key={type} onPress={() => addReaction.mutate({ messageId: item.id, type: type as ReactionType })}
                style={[styles.reactionChip, { backgroundColor: colors.surface, borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 3, marginRight: spacing.xs, marginTop: spacing.sm }]}>
                <Text style={{ fontSize: 13 }}>{emoji}</Text>
                <Text style={[typography.captionMedium, { marginLeft: 3, color: colors.textSecondary }]}>{count}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: channel?.name ?? 'Channel', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.textPrimary, headerShadowVisible: false }} />
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={100}>
          <FlatList<ChatMessage> data={messages} keyExtractor={(item) => item.id} renderItem={renderMessage}
            contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.md }}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => refetch()} tintColor={colors.accent} />}
            onEndReached={() => fetchNextPage()} onEndReachedThreshold={0.3}
            ListEmptyComponent={!isLoading ? <View style={{ paddingTop: 60, alignItems: 'center' }}><Text style={[typography.body, { color: colors.textTertiary }]}>Noch keine Nachrichten</Text></View> : null}
          />
          {isOfficialRestricted ? (
            <View style={{ paddingVertical: spacing.lg, alignItems: 'center' }}>
              <Text style={[typography.bodySmall, { color: colors.textSecondary, textAlign: 'center' }]}>Nur Admins koennen hier posten</Text>
            </View>
          ) : (
            <>
              {replyTo && (
                <View style={[styles.replyBar, { backgroundColor: colors.surface, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm }]}>
                  <Text style={[typography.caption, { color: colors.textSecondary, flex: 1 }]} numberOfLines={1}>Antwort auf: {replyTo.content}</Text>
                  <Pressable onPress={() => setReplyTo(null)}><Ionicons name="close" size={18} color={colors.textSecondary} /></Pressable>
                </View>
              )}
              <View style={[styles.inputBar, { backgroundColor: colors.cardBackground, borderTopColor: colors.separator, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm }]}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderRadius: borderRadius.full, color: colors.textPrimary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: 15, flex: 1 }]}
                  value={newMessage} onChangeText={setNewMessage} placeholder="Nachricht schreiben..." placeholderTextColor={colors.textTertiary} multiline maxLength={5000}
                />
                <Pressable onPress={handleSend} disabled={!newMessage.trim()}
                  style={[styles.sendButton, { backgroundColor: newMessage.trim() ? colors.chipActive : colors.surface, borderRadius: borderRadius.full, marginLeft: spacing.sm }]}>
                  <Ionicons name="arrow-up" size={20} color={newMessage.trim() ? '#FFFFFF' : colors.textTertiary} />
                </Pressable>
              </View>
            </>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Image Viewer Modal */}
      <Modal visible={viewerImage !== null} transparent animationType="fade" onRequestClose={() => setViewerImage(null)}>
        <Pressable style={styles.imageViewerOverlay} onPress={() => setViewerImage(null)}>
          <Pressable onPress={() => setViewerImage(null)} style={{ position: 'absolute', top: 60, right: 20, zIndex: 1 }}>
            <Ionicons name="close-circle" size={32} color="#FFFFFF" />
          </Pressable>
          {viewerImage && (
            <Image source={{ uri: viewerImage }} style={{ width: '90%', height: '70%' }} resizeMode="contain" />
          )}
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  msgCard: {},
  msgHeader: { flexDirection: 'row', alignItems: 'center' },
  replyPreview: { borderLeftWidth: 3 },
  reactionsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  reactionChip: { flexDirection: 'row', alignItems: 'center' },
  replyBar: { flexDirection: 'row', alignItems: 'center' },
  inputBar: { borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'flex-end' },
  input: { maxHeight: 100 },
  sendButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  imageViewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
});
