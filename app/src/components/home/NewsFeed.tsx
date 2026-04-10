import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Share } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { formatTimeAgo } from '../../utils/formatDate';
import type { NewsItem } from './newsTypes';

export type { NewsItem } from './newsTypes';

interface NewsFeedProps {
  items: NewsItem[];
}

export function NewsFeed({ items }: NewsFeedProps) {
  const { colors, typography, spacing } = useTheme();

  if (items.length === 0) return null;

  return (
    <View>
      <Text style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.md }]}>
        Neuigkeiten
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={280 + spacing.md}
        contentContainerStyle={{ paddingRight: spacing.xl }}
      >
        {items.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </ScrollView>
    </View>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const { colors, typography, spacing, borderRadius, isDark } = useTheme();
  const router = useRouter();
  const [liked, setLiked] = useState(item.isLiked);
  const [likeCount, setLikeCount] = useState(item.likes);

  const handleLike = useCallback(() => {
    setLiked((prev) => {
      setLikeCount((c) => (prev ? c - 1 : c + 1));
      return !prev;
    });
  }, []);

  const handleShare = useCallback(() => {
    Share.share({ title: item.title, message: `${item.title}\n\n${item.content}` });
  }, [item]);

  const openDetail = useCallback(() => {
    router.push(`/news/${item.id}` as never);
  }, [item.id, router]);

  const actionColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  return (
    <Pressable
      onPress={openDetail}
      accessibilityLabel={`Nachricht: ${item.title}`}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.backgroundSecondary,
          borderRadius: borderRadius.xl,
          marginRight: spacing.md,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          style={[
            styles.image,
            { borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl },
          ]}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          accessibilityElementsHidden
        />
      )}
      <View style={styles.cardBody}>
        <Text style={[typography.label, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text
          style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 4 }]}
          numberOfLines={2}
        >
          {item.content}
        </Text>
        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 8 }]}>
          {item.author.firstName} {item.author.lastName} · {formatTimeAgo(item.createdAt)}
        </Text>
      </View>

      {/* Action bar */}
      <View
        style={[
          styles.actionBar,
          { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
        ]}
      >
        <Pressable
          onPress={handleLike}
          accessibilityLabel={liked ? 'Gefällt mir entfernen' : 'Gefällt mir'}
          accessibilityRole="button"
          style={[styles.action, { backgroundColor: actionColor, borderRadius: borderRadius.md }]}
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={16}
            color={liked ? colors.danger : colors.textSecondary}
          />
          <Text
            style={[
              typography.captionMedium,
              { color: liked ? colors.danger : colors.textSecondary, marginLeft: 5 },
            ]}
          >
            {likeCount}
          </Text>
        </Pressable>

        <Pressable
          onPress={openDetail}
          accessibilityLabel={`${item.comments.length} Kommentare`}
          accessibilityRole="button"
          style={[styles.action, { backgroundColor: actionColor, borderRadius: borderRadius.md }]}
        >
          <Ionicons name="chatbubble-outline" size={15} color={colors.textSecondary} />
          <Text style={[typography.captionMedium, { color: colors.textSecondary, marginLeft: 5 }]}>
            {item.comments.length}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleShare}
          accessibilityLabel="Teilen"
          accessibilityRole="button"
          style={[styles.action, { backgroundColor: actionColor, borderRadius: borderRadius.md }]}
        >
          <Ionicons name="paper-plane-outline" size={15} color={colors.textSecondary} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 280, overflow: 'hidden' },
  image: { width: 280, height: 150 },
  cardBody: { padding: 14, paddingBottom: 10 },
  actionBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  action: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6 },
});
