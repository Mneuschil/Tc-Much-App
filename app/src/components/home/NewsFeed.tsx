import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme';
import { formatDate } from '../../utils/formatDate';
import type { NewsListItem } from '../../features/news/services/newsService';

interface NewsFeedProps {
  items: NewsListItem[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function NewsFeed({ items, isLoading, isError, onRetry }: NewsFeedProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View>
      <Text
        style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.md }]}
        accessibilityRole="header"
      >
        Neuigkeiten
      </Text>

      {isLoading && (
        <View style={styles.stateRow}>
          <ActivityIndicator color={colors.textSecondary} />
        </View>
      )}

      {!isLoading && isError && (
        <View style={styles.stateRow}>
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
            Neuigkeiten konnten nicht geladen werden.
          </Text>
          <Pressable
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Erneut versuchen"
            hitSlop={8}
          >
            <Text style={[typography.captionMedium, { color: colors.accent, marginTop: 4 }]}>
              Erneut versuchen
            </Text>
          </Pressable>
        </View>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <View style={styles.stateRow}>
          <Text style={[typography.bodySmall, { color: colors.textTertiary }]}>
            Noch keine Beiträge.
          </Text>
        </View>
      )}

      {!isLoading && !isError && items.length > 0 && (
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
      )}
    </View>
  );
}

function NewsCard({ item }: { item: NewsListItem }) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();

  const openDetail = (): void => {
    router.push(`/news/${item.id}` as never);
  };

  return (
    <Pressable
      onPress={openDetail}
      accessibilityRole="button"
      accessibilityLabel={`Beitrag öffnen: ${item.title}`}
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
        <Text style={[typography.caption, { color: colors.accent, marginBottom: 4 }]}>
          {item.tag}
        </Text>
        <Text style={[typography.label, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.title}
        </Text>
        {item.description && (
          <Text
            style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 4 }]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}
        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 8 }]}>
          {formatDate(item.date)}
          {item.author ? ` · ${item.author}` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 280, overflow: 'hidden' },
  image: { width: 280, height: 150 },
  cardBody: { padding: 14, paddingBottom: 14 },
  stateRow: { paddingVertical: 16, paddingRight: 24 },
});
