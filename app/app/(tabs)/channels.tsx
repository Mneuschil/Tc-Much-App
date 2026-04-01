import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { EmptyState, SearchInput, Badge } from '../../src/components/ui';
import { useChannels } from '../../src/features/chat/hooks/useChannels';
import { formatTimeAgo } from '../../src/utils/formatDate';
import { MOCK_CHANNELS } from '../../src/lib/mockData';

interface LastMessage {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
}

interface ChannelItem {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  isDefault: boolean;
  subchannels: Array<{ id: string; name: string }>;
  _count: { messages: number; members: number };
  lastMessage: LastMessage | null;
}

export default function ChannelsScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useChannels();
  const apiChannels = ((data ?? []) as ChannelItem[]);
  const allChannels = apiChannels.length > 0 ? apiChannels : (MOCK_CHANNELS as unknown as ChannelItem[]);

  const channels = useMemo(() => {
    if (!search.trim()) return allChannels;
    const q = search.toLowerCase();
    return allChannels.filter(ch => ch.name.toLowerCase().includes(q));
  }, [allChannels, search]);

  const isOfficial = (item: ChannelItem) => item.isDefault && item.visibility === 'PUBLIC';

  const renderChannel = ({ item }: { item: ChannelItem }) => (
    <Pressable
      onPress={() => router.push(`/channel/${item.id}`)}
      style={({ pressed }) => [
        { backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.md, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={styles.channelRow}>
        <View style={[styles.channelIcon, {
          backgroundColor: isOfficial(item) ? colors.accentSurface : item.visibility === 'RESTRICTED' ? colors.accent + '12' : colors.surface,
          borderRadius: borderRadius.lg,
        }]}>
          {isOfficial(item) ? (
            <Ionicons name="lock-closed" size={18} color={colors.accent} />
          ) : item.visibility === 'RESTRICTED' ? (
            <Ionicons name="lock-closed" size={18} color={colors.textSecondary} />
          ) : (
            <Ionicons name="chatbubble" size={18} color={colors.textSecondary} />
          )}
        </View>
        <View style={styles.channelInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>{item.name}</Text>
            {isOfficial(item) && <Badge label="Offiziell" variant="accent" size="sm" />}
          </View>
          {item.lastMessage ? (
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>
              {item.lastMessage.author.firstName}: {item.lastMessage.content}
            </Text>
          ) : item.description ? (
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>{item.description}</Text>
          ) : null}
          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 4 }]}>
            {item.lastMessage ? formatTimeAgo(item.lastMessage.createdAt) : `${item._count.messages} Nachrichten`}
            {item.subchannels?.length > 0 && ` · ${item.subchannels.length} Sub`}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm }}>
        <Text style={[typography.h1, { color: colors.textPrimary }]}>Chats</Text>
      </View>
      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
        <SearchInput placeholder="Channel suchen..." value={search} onChangeText={setSearch} />
      </View>
      <FlatList
        data={channels}
        keyExtractor={(item) => item.id}
        renderItem={renderChannel}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
        ListEmptyComponent={!isLoading ? <EmptyState title="Keine Channels" description={search ? 'Kein Channel gefunden' : 'Es gibt noch keine Channels'} /> : null}
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
