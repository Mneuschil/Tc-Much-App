import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { formatDate } from '../../src/utils/formatDate';
import { useNewsDetail } from '../../src/features/news/hooks/useNews';

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing } = useTheme();

  const { data, isLoading, isError, refetch, isRefetching } = useNewsDetail(id);

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

            <Text
              style={[
                typography.body,
                {
                  color: colors.textPrimary,
                  marginTop: spacing.xl,
                  lineHeight: 24,
                },
              ]}
            >
              {data.body}
            </Text>
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
