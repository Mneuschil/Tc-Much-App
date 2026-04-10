import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { SearchInput, EmptyState, QueryError } from '../../src/components/ui';
import { ChannelListItem, CreateChannelModal } from '../../src/components/chat';
import type { ChannelItem } from '../../src/components/chat';
import { useChannels } from '../../src/features/chat/hooks/useChannels';
import { usePermissions } from '../../src/hooks/usePermissions';

const ListSeparator = React.memo(function ListSeparator({ color }: { color: string }) {
  return <View style={[styles.separator, { backgroundColor: color }]} />;
});

export default function ChannelsScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const { isBoard, isAdmin } = usePermissions();
  const canCreateChannel = isBoard || isAdmin;
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, isError, refetch } = useChannels();
  const allChannels = useMemo(() => (data ?? []) as ChannelItem[], [data]);

  const channels = useMemo(() => {
    if (!search.trim()) return allChannels;
    const q = search.toLowerCase();
    return allChannels.filter((ch) => ch.name.toLowerCase().includes(q));
  }, [allChannels, search]);

  const handleChannelPress = useCallback((id: string) => router.push(`/channel/${id}`), [router]);

  const renderChannel = useCallback(
    ({ item }: { item: ChannelItem }) => (
      <ChannelListItem item={item} onPress={handleChannelPress} />
    ),
    [handleChannelPress],
  );

  const separator = useCallback(
    () => <ListSeparator color={colors.separator} />,
    [colors.separator],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm }}
      >
        <Text style={[typography.h1, { color: colors.textPrimary }]}>Chats</Text>
      </View>
      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.sm }}>
        <SearchInput placeholder="Channel suchen..." value={search} onChangeText={setSearch} />
      </View>

      <FlashList
        data={channels}
        keyExtractor={(item) => item.id}
        renderItem={renderChannel}
        ItemSeparatorComponent={separator}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          !isLoading ? (
            isError ? (
              <QueryError onRetry={refetch} />
            ) : (
              <EmptyState
                title="Keine Channels"
                description={search ? 'Kein Channel gefunden' : 'Es gibt noch keine Channels'}
              />
            )
          ) : null
        }
      />

      {canCreateChannel && (
        <Pressable
          onPress={() => setShowCreate(true)}
          style={[styles.fab, { backgroundColor: colors.accent }]}
        >
          <Ionicons name="add" size={24} color={colors.buttonPrimaryText} />
        </Pressable>
      )}

      <CreateChannelModal visible={showCreate} onClose={() => setShowCreate(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 86 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
