import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { EmptyState } from '../../src/components/ui';
import { useChannels } from '../../src/features/chat/hooks/useChannels';
import { MOCK_CHANNELS } from '../../src/lib/mockData';

export default function ChannelsScreen() {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const router = useRouter();

  const { data, isLoading, refetch } = useChannels();
  const apiChannels = ((data ?? []) as any[]);
  const channels = apiChannels.length > 0 ? apiChannels : MOCK_CHANNELS;

  const renderChannel = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => router.push(`/channel/${item.id}`)}
      style={({ pressed }) => [
        { backgroundColor: colors.cardBackground, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.md, opacity: pressed ? 0.9 : 1, ...shadows.sm },
      ]}
    >
      <View style={styles.channelRow}>
        <View style={[styles.channelIcon, { backgroundColor: item.visibility === 'RESTRICTED' ? colors.accent + '12' : colors.surface, borderRadius: borderRadius.lg }]}>
          <Ionicons name={item.visibility === 'RESTRICTED' ? 'lock-closed' : 'chatbubble'} size={18} color={item.visibility === 'RESTRICTED' ? colors.accent : colors.textSecondary} />
        </View>
        <View style={styles.channelInfo}>
          <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>{item.name}</Text>
          {item.description && <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>{item.description}</Text>}
          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 4 }]}>
            {item._count.messages} Nachrichten{item.subchannels?.length > 0 && ` · ${item.subchannels.length} Sub`}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md }}>
        <Text style={[typography.h1, { color: colors.textPrimary }]}>Chats</Text>
      </View>
      <FlatList
        data={channels}
        keyExtractor={(item) => item.id}
        renderItem={renderChannel}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
        ListEmptyComponent={!isLoading ? <EmptyState title="Keine Channels" description="Es gibt noch keine Channels" /> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  channelRow: { flexDirection: 'row', alignItems: 'center' },
  channelIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  channelInfo: { flex: 1 },
});
