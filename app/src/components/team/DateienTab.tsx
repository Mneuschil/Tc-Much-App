import { View, Text, StyleSheet, FlatList, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { EmptyState } from '../ui';
import { useChannelFiles } from '../../features/files/hooks/useFiles';
import { formatDate } from '../../utils/formatDate';

interface FileData {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

interface DateienTabProps {
  channelId: string | undefined | null;
}

export function DateienTab({ channelId }: DateienTabProps) {
  const { colors, typography, spacing } = useTheme();
  const { data } = useChannelFiles(channelId ?? '');
  const files = (data ?? []) as FileData[];

  if (!channelId) {
    return <EmptyState title="Keine Dateien" description="Kein Kanal verknuepft" />;
  }

  return (
    <FlatList
      data={files}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 100 }}
      ListEmptyComponent={
        <EmptyState title="Keine Dateien" description="Noch keine Dateien in diesem Team" />
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => Linking.openURL(item.url)}
          style={({ pressed }) => [
            styles.fileRow,
            {
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.xl,
              borderBottomColor: colors.separator,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <View style={[styles.fileIcon, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons
              name={
                item.mimeType.startsWith('image/')
                  ? 'image-outline'
                  : item.mimeType.startsWith('video/')
                    ? 'film-outline'
                    : 'document-outline'
              }
              size={20}
              color={colors.textSecondary}
            />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={[typography.bodyMedium, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
