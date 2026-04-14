import { Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface FolderBreadcrumbProps {
  folderName: string;
  onNavigateBack: () => void;
}

export function FolderBreadcrumb({ folderName, onNavigateBack }: FolderBreadcrumbProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <Pressable
      onPress={onNavigateBack}
      accessibilityLabel="Zurück zum übergeordneten Ordner"
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.breadcrumb,
        {
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
          backgroundColor: colors.backgroundSecondary,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Ionicons name="arrow-back" size={18} color={colors.accent} />
      <Ionicons name="folder" size={16} color={colors.accent} style={{ marginLeft: spacing.sm }} />
      <Text style={[typography.bodyMedium, { color: colors.accent, marginLeft: spacing.xs }]}>
        {folderName}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  breadcrumb: { flexDirection: 'row', alignItems: 'center' },
});
