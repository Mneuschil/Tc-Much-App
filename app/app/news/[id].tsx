import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { Avatar } from '../../src/components/ui';
import { formatTimeAgo } from '../../src/utils/formatDate';
import { getNewsById } from '../../src/components/home/mockNews';
import type { NewsComment } from '../../src/components/home/newsTypes';

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing, borderRadius } = useTheme();

  const news = getNewsById(id ?? '');

  const [liked, setLiked] = useState(news?.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(news?.likes ?? 0);
  const [comments, setComments] = useState<NewsComment[]>(news?.comments ?? []);
  const [text, setText] = useState('');

  const handleLike = useCallback(() => {
    setLiked((prev) => {
      setLikeCount((c) => (prev ? c - 1 : c + 1));
      return !prev;
    });
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const newComment: NewsComment = {
      id: `local-${Date.now()}`,
      author: { firstName: 'Du', lastName: '' },
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [...prev, newComment]);
    setText('');
  }, [text]);

  const handleShare = useCallback(() => {
    if (!news) return;
    Share.share({ title: news.title, message: `${news.title}\n\n${news.content}` });
  }, [news]);

  if (!news) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Beitrag' }} />
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            Beitrag nicht gefunden
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: '',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView
        edges={['bottom']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={100}
        >
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Hero image */}
            {news.imageUrl && (
              <Image
                source={{ uri: news.imageUrl }}
                style={styles.heroImage}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
            )}

            <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xl }}>
              {/* Title */}
              <Text style={[typography.h1, { color: colors.textPrimary }]}>{news.title}</Text>

              {/* Author + time */}
              <View style={[styles.authorRow, { marginTop: spacing.md }]}>
                <Avatar
                  firstName={news.author.firstName}
                  lastName={news.author.lastName}
                  size="sm"
                />
                <View style={{ marginLeft: spacing.sm }}>
                  <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
                    {news.author.firstName} {news.author.lastName}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textTertiary }]}>
                    {formatTimeAgo(news.createdAt)}
                  </Text>
                </View>
              </View>

              {/* Action row */}
              <View
                style={[styles.actionRow, { marginTop: spacing.lg, borderColor: colors.separator }]}
              >
                <Pressable onPress={handleLike} style={styles.actionBtn}>
                  <Ionicons
                    name={liked ? 'heart' : 'heart-outline'}
                    size={20}
                    color={liked ? colors.danger : colors.textSecondary}
                  />
                  <Text
                    style={[
                      typography.bodySmall,
                      { color: liked ? colors.danger : colors.textSecondary, marginLeft: 6 },
                    ]}
                  >
                    {likeCount}
                  </Text>
                </Pressable>
                <Pressable style={styles.actionBtn}>
                  <Ionicons name="chatbubble-outline" size={19} color={colors.textSecondary} />
                  <Text
                    style={[typography.bodySmall, { color: colors.textSecondary, marginLeft: 6 }]}
                  >
                    {comments.length}
                  </Text>
                </Pressable>
                <Pressable onPress={handleShare} style={styles.actionBtn}>
                  <Ionicons name="paper-plane-outline" size={19} color={colors.textSecondary} />
                </Pressable>
              </View>

              {/* Content */}
              <Text
                style={[
                  typography.body,
                  { color: colors.textPrimary, marginTop: spacing.xl, lineHeight: 24 },
                ]}
              >
                {news.content}
              </Text>

              {/* Comments section */}
              <View style={{ marginTop: spacing.xxxl }}>
                <Text
                  style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.lg }]}
                >
                  Kommentare ({comments.length})
                </Text>
                {comments.length === 0 && (
                  <Text style={[typography.bodySmall, { color: colors.textTertiary }]}>
                    Noch keine Kommentare — sei der Erste!
                  </Text>
                )}
                {comments.map((c) => (
                  <View key={c.id} style={[styles.comment, { marginBottom: spacing.lg }]}>
                    <Avatar firstName={c.author.firstName} lastName={c.author.lastName} size="sm" />
                    <View
                      style={[
                        styles.commentBubble,
                        {
                          backgroundColor: colors.backgroundSecondary,
                          borderRadius: borderRadius.xl,
                        },
                      ]}
                    >
                      <Text style={[typography.captionMedium, { color: colors.textPrimary }]}>
                        {c.author.firstName} {c.author.lastName}
                      </Text>
                      <Text
                        style={[typography.bodySmall, { color: colors.textPrimary, marginTop: 2 }]}
                      >
                        {c.content}
                      </Text>
                      <Text
                        style={[typography.caption, { color: colors.textTertiary, marginTop: 4 }]}
                      >
                        {formatTimeAgo(c.createdAt)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Comment input */}
          <View
            style={[
              styles.inputBar,
              { backgroundColor: colors.background, borderTopColor: colors.separator },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: borderRadius.xl,
                  color: colors.textPrimary,
                  ...typography.bodySmall,
                },
              ]}
              placeholder="Kommentar schreiben..."
              placeholderTextColor={colors.textTertiary}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={500}
            />
            <Pressable
              onPress={handleSend}
              disabled={!text.trim()}
              style={[
                styles.sendBtn,
                {
                  backgroundColor: text.trim() ? colors.accentLight : colors.backgroundTertiary,
                  borderRadius: borderRadius.full,
                },
              ]}
            >
              <Ionicons
                name="arrow-up"
                size={18}
                color={text.trim() ? colors.textInverse : colors.textTertiary}
              />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroImage: { width: '100%', height: 220 },
  authorRow: { flexDirection: 'row', alignItems: 'center' },
  actionRow: {
    flexDirection: 'row',
    gap: 20,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  comment: { flexDirection: 'row', alignItems: 'flex-start' },
  commentBubble: { flex: 1, marginLeft: 10, padding: 12 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  input: { flex: 1, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100 },
  sendBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});
