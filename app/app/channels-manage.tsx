import React from 'react';
import { View, Text, FlatList, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme';
import { Badge } from '../src/components/ui/Badge';
import { useChannelList, useToggleMute } from '../src/hooks/useSettings';
import type { Channel } from '@tennis-club/shared';
import { ChannelVisibility } from '@tennis-club/shared';

export default function ChannelsManageScreen() {
  const { colors, spacing, typography } = useTheme();
  const { data: channels, isLoading, refetch } = useChannelList();
  const toggleMute = useToggleMute();

  const renderChannel = ({ item }: { item: Channel & { isMuted?: boolean } }) => (
    <View style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator, paddingVertical: spacing.lg }]}>
      <View style={{ flex: 1 }}>
        <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>{item.name}</Text>
        <View style={{ marginTop: spacing.xs }}>
          <Badge
            label={item.visibility === ChannelVisibility.PUBLIC ? 'Öffentlich' : 'Eingeschränkt'}
            variant={item.visibility === ChannelVisibility.PUBLIC ? 'accent' : 'neutral'}
            size="sm"
          />
        </View>
      </View>
      <Switch
        value={!item.isMuted}
        onValueChange={() => toggleMute.mutate(item.id)}
        trackColor={{ true: colors.accent, false: colors.backgroundTertiary }}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md }}>
        <Text style={[typography.h1, { color: colors.textPrimary }]}>Kanäle</Text>
      </View>
      <FlatList
        data={channels ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderChannel}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}
        refreshing={isLoading}
        onRefresh={refetch}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
