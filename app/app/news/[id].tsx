import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
  ActivityIndicator,
  RefreshControl,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../../src/theme';
import { formatDate } from '../../src/utils/formatDate';
import { useNewsDetail } from '../../src/features/news/hooks/useNews';

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing } = useTheme();
  const { width } = useWindowDimensions();
  const bodyMaxWidth = width - spacing.xl * 2;

  const { data, isLoading, isError, refetch, isRefetching } = useNewsDetail(id);

  const markdownStyles = useMemo(
    () => ({
      body: { color: colors.textPrimary, fontSize: 16, lineHeight: 24 },
      paragraph: { marginTop: 0, marginBottom: 14, color: colors.textPrimary },
      heading1: { ...typography.h2, color: colors.textPrimary, marginTop: 16, marginBottom: 8 },
      heading2: { ...typography.h3, color: colors.textPrimary, marginTop: 16, marginBottom: 8 },
      heading3: { ...typography.h4, color: colors.textPrimary, marginTop: 12, marginBottom: 6 },
      strong: { fontWeight: '700' as const, color: colors.textPrimary },
      em: { fontStyle: 'italic' as const },
      link: { color: colors.accent, textDecorationLine: 'underline' as const },
      bullet_list: { marginBottom: 14 },
      ordered_list: { marginBottom: 14 },
      list_item: { marginBottom: 4, color: colors.textPrimary },
      blockquote: {
        backgroundColor: colors.backgroundSecondary,
        borderLeftColor: colors.accent,
        borderLeftWidth: 3,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginVertical: 8,
      },
      code_inline: {
        backgroundColor: colors.backgroundSecondary,
        color: colors.textPrimary,
        paddingHorizontal: 4,
        borderRadius: 4,
      },
      hr: { backgroundColor: colors.separator, height: 1, marginVertical: 16 },
    }),
    [colors, typography],
  );

  const markdownRules = useMemo(
    () => ({
      // Render images via expo-image so they cache and we can control sizing.
      image: (node: { attributes: { src?: string; alt?: string } }) => {
        const src = node.attributes.src;
        if (!src) return null;
        return (
          <Image
            key={src}
            source={{ uri: src }}
            style={{
              width: bodyMaxWidth,
              height: bodyMaxWidth * 0.66,
              marginVertical: 8,
              borderRadius: 12,
            }}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            accessibilityLabel={node.attributes.alt ?? undefined}
          />
        );
      },
    }),
    [bodyMaxWidth],
  );

  const handleLinkPress = useCallback((url: string) => {
    void Linking.openURL(url);
    return false;
  }, []);

  const handleShare = useCallback(() => {
    if (!data) return;
    Share.share({
      title: data.title,
      message: `${data.title}\n\n${data.description ?? ''}`,
    });
  }, [data]);

  const centered = (content: React.ReactNode): React.ReactElement => (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Beitrag' }} />
      <View style={[styles.center, { backgroundColor: colors.background }]}>{content}</View>
    </>
  );

  if (isLoading) {
    return centered(<ActivityIndicator color={colors.textSecondary} />);
  }

  if (isError) {
    return centered(
      <>
        <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
          Beitrag konnte nicht geladen werden.
        </Text>
        <Pressable
          onPress={() => void refetch()}
          accessibilityRole="button"
          accessibilityLabel="Erneut versuchen"
          hitSlop={8}
          style={{ marginTop: spacing.md }}
        >
          <Text style={[typography.bodyMedium, { color: colors.accent }]}>Erneut versuchen</Text>
        </Pressable>
      </>,
    );
  }

  if (!data) {
    return centered(
      <Text style={[typography.body, { color: colors.textSecondary }]}>
        Beitrag nicht gefunden
      </Text>,
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
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={colors.textSecondary}
            />
          }
        >
          {data.imageUrl && (
            <Image
              source={{ uri: data.imageUrl }}
              style={styles.heroImage}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          )}

          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xl }}>
            <Text style={[typography.caption, { color: colors.accent }]}>{data.tag}</Text>
            <Text style={[typography.h1, { color: colors.textPrimary, marginTop: 6 }]}>
              {data.title}
            </Text>

            <Text
              style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.sm }]}
            >
              {formatDate(data.date)}
              {data.author ? ` · ${data.author}` : ''}
            </Text>

            <View
              style={[styles.actionRow, { marginTop: spacing.lg, borderColor: colors.separator }]}
            >
              <Pressable
                onPress={handleShare}
                accessibilityLabel="Teilen"
                accessibilityRole="button"
                style={styles.actionBtn}
              >
                <Ionicons name="paper-plane-outline" size={19} color={colors.textSecondary} />
                <Text
                  style={[typography.bodySmall, { color: colors.textSecondary, marginLeft: 6 }]}
                >
                  Teilen
                </Text>
              </Pressable>
            </View>

            <View style={{ marginTop: spacing.xl }}>
              <Markdown style={markdownStyles} rules={markdownRules} onLinkPress={handleLinkPress}>
                {data.body}
              </Markdown>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  heroImage: { width: '100%', height: 220 },
  actionRow: {
    flexDirection: 'row',
    gap: 20,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
});

export { ScreenErrorBoundary as ErrorBoundary } from '../../src/components/ScreenErrorBoundary';
