import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface FolderCreateModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  isPending: boolean;
}

export function FolderCreateModal({
  visible,
  onClose,
  onCreate,
  isPending,
}: FolderCreateModalProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [folderName, setFolderName] = useState('');

  const handleCreate = () => {
    if (!folderName.trim()) return;
    onCreate(folderName.trim());
  };

  const handleClose = () => {
    setFolderName('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <View
          style={[styles.header, { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg }]}
        >
          <Text style={[typography.h2, { color: colors.textPrimary }]}>Neuer Ordner</Text>
          <Pressable onPress={handleClose} hitSlop={12}>
            <Ionicons name="close" size={26} color={colors.textPrimary} />
          </Pressable>
        </View>
        <View style={{ paddingHorizontal: spacing.xl }}>
          <Text
            style={[
              typography.captionMedium,
              { color: colors.textSecondary, marginBottom: spacing.xs },
            ]}
          >
            Ordnername
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.backgroundSecondary,
                borderRadius: borderRadius.md,
                color: colors.textPrimary,
              },
            ]}
            value={folderName}
            onChangeText={setFolderName}
            placeholder="z.B. Spielberichte, Fotos, Dokumente..."
            placeholderTextColor={colors.textTertiary}
            autoFocus
          />
          <Pressable
            onPress={handleCreate}
            disabled={!folderName.trim() || isPending}
            style={({ pressed }) => [
              styles.createBtn,
              {
                backgroundColor: folderName.trim() ? colors.accent : colors.surface,
                borderRadius: borderRadius.md,
                marginTop: spacing.xl,
                opacity: isPending ? 0.5 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons
              name="folder-open-outline"
              size={20}
              color={folderName.trim() ? colors.textInverse : colors.textTertiary}
              style={{ marginRight: spacing.sm }}
            />
            <Text
              style={[
                typography.button,
                { color: folderName.trim() ? colors.textInverse : colors.textTertiary },
              ]}
            >
              Ordner erstellen
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: { height: 48, paddingHorizontal: 16, fontSize: 15 },
  createBtn: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
