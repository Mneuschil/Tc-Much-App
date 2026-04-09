import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface FolderData {
  id: string;
  name: string;
  _count?: { files: number };
}

interface FolderRowProps {
  folder: FolderData;
  onPress: (folder: FolderData) => void;
}

export type { FolderData };

export function FolderRow({ folder, onPress }: FolderRowProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <Pressable
      onPress={() => onPress(folder)}
      style={({ pressed }) => [
        styles.row,
        {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          borderBottomColor: colors.separator,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: colors.accentSubtle }]}>
        <Ionicons name="folder" size={20} color={colors.accent} />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>{folder.name}</Text>
        {folder._count?.files !== undefined && (
          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
            {folder._count.files} {folder._count.files === 1 ? 'Datei' : 'Dateien'}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
