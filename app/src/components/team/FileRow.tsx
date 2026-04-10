import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { formatDate } from '../../utils/formatDate';

interface FileData {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

interface FileRowProps {
  file: FileData;
  onPress: (file: FileData) => void;
  onDelete?: (file: FileData) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string): keyof typeof Ionicons.glyphMap {
  if (mimeType.startsWith('image/')) return 'image-outline';
  if (mimeType.startsWith('video/')) return 'film-outline';
  if (mimeType.includes('pdf')) return 'document-text-outline';
  return 'document-outline';
}

export type { FileData };

export function FileRow({ file, onPress, onDelete }: FileRowProps) {
  const { colors, typography, spacing } = useTheme();

  const handleLongPress = () => {
    if (!onDelete) return;
    Alert.alert('Datei löschen', `"${file.name}" wirklich löschen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => onDelete(file) },
    ]);
  };

  return (
    <Pressable
      onPress={() => onPress(file)}
      onLongPress={onDelete ? handleLongPress : undefined}
      accessibilityLabel={`Datei ${file.name}`}
      accessibilityRole="button"
      accessibilityHint="Tippen zum Öffnen, lang drücken zum Löschen"
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
      <View
        style={[styles.icon, { backgroundColor: colors.backgroundSecondary }]}
        importantForAccessibility="no"
        accessibilityElementsHidden
      >
        <Ionicons name={getFileIcon(file.mimeType)} size={20} color={colors.textSecondary} />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={[typography.bodyMedium, { color: colors.textPrimary }]} numberOfLines={1}>
          {file.name}
        </Text>
        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
          {formatFileSize(file.size)} · {formatDate(file.createdAt)}
        </Text>
      </View>
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
