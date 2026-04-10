import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface FileUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onUpload: (displayName: string) => void;
  isPending: boolean;
  filePreview?: {
    uri: string;
    mimeType: string;
    originalName: string;
  } | null;
}

export function FileUploadModal({
  visible,
  onClose,
  onUpload,
  isPending,
  filePreview,
}: FileUploadModalProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [name, setName] = useState('');

  useEffect(() => {
    if (filePreview) {
      const baseName = filePreview.originalName.replace(/\.[^.]+$/, '');
      setName(baseName);
    }
  }, [filePreview]);

  const handleUpload = () => {
    const ext = filePreview?.originalName.match(/\.[^.]+$/)?.[0] ?? '';
    const finalName = name.trim()
      ? `${name.trim()}${ext}`
      : (filePreview?.originalName ?? 'upload');
    onUpload(finalName);
  };

  const handleClose = () => {
    setName('');
    onClose();
  };

  const isImage = filePreview?.mimeType.startsWith('image/');

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
          <Text style={[typography.h2, { color: colors.textPrimary }]}>Datei hochladen</Text>
          <Pressable
            onPress={handleClose}
            hitSlop={12}
            accessibilityLabel="Modal schließen"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={26} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: spacing.xl }}>
          {isImage && filePreview && (
            <View
              style={[
                styles.preview,
                { backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.lg },
              ]}
            >
              <Image
                source={{ uri: filePreview.uri }}
                style={[styles.previewImage, { borderRadius: borderRadius.md }]}
                resizeMode="cover"
                accessibilityElementsHidden
              />
            </View>
          )}

          {!isImage && filePreview && (
            <View
              style={[
                styles.docPreview,
                { backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.lg },
              ]}
            >
              <Ionicons name="document-outline" size={40} color={colors.textSecondary} />
              <Text
                style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.sm }]}
              >
                {filePreview.mimeType}
              </Text>
            </View>
          )}

          <Text
            style={[
              typography.captionMedium,
              { color: colors.textSecondary, marginTop: spacing.xl, marginBottom: spacing.xs },
            ]}
          >
            Dateiname
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
            value={name}
            onChangeText={setName}
            placeholder="Datei benennen..."
            placeholderTextColor={colors.textTertiary}
            autoFocus
            accessibilityLabel="Dateiname"
          />

          <Pressable
            onPress={handleUpload}
            disabled={isPending}
            accessibilityLabel={isPending ? 'Wird hochgeladen' : 'Datei hochladen'}
            accessibilityRole="button"
            accessibilityState={{ disabled: isPending }}
            style={({ pressed }) => [
              styles.uploadBtn,
              {
                backgroundColor: colors.accent,
                borderRadius: borderRadius.md,
                marginTop: spacing.xl,
                opacity: isPending ? 0.5 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={20}
              color={colors.textInverse}
              style={{ marginRight: spacing.sm }}
            />
            <Text style={[typography.button, { color: colors.textInverse }]}>
              {isPending ? 'Wird hochgeladen...' : 'Hochladen'}
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
  preview: { alignItems: 'center', padding: 12, marginBottom: 8 },
  previewImage: { width: '100%', height: 200 },
  docPreview: { alignItems: 'center', justifyContent: 'center', padding: 24, marginBottom: 8 },
  input: { height: 48, paddingHorizontal: 16, fontSize: 15 },
  uploadBtn: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
