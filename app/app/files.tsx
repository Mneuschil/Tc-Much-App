import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, Linking, ActionSheetIOS, Platform, Alert, Image } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../src/theme';
import { Button, EmptyState } from '../src/components/ui';
import { useChannelFiles, useDeleteFile } from '../src/features/files/hooks/useFiles';
import { formatDate } from '../src/utils/formatDate';
import api from '../src/lib/api';
import type { File as ClubFile } from '@tennis-club/shared';

const DEFAULT_CHANNEL_ID = 'general';

function getFileIcon(mimeType: string): keyof typeof Ionicons.glyphMap {
  if (mimeType.startsWith('image/')) return 'image-outline';
  if (mimeType.startsWith('video/')) return 'film-outline';
  return 'document-outline';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilesScreen() {
  const { colors, typography, spacing, radii } = useTheme();
  const { data, isLoading, refetch } = useChannelFiles(DEFAULT_CHANNEL_ID);
  const files = (data ?? []) as ClubFile[];
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const handleFilePress = useCallback((file: ClubFile) => {
    if (file.mimeType.startsWith('image/')) {
      setViewerImage(file.url);
    } else {
      Linking.openURL(file.url);
    }
  }, []);

  const handleUpload = useCallback(() => {
    const options = ['Kamera', 'Galerie', 'Abbrechen'];
    const cancelButtonIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex },
        (buttonIndex) => {
          if (buttonIndex === 0) pickFromCamera();
          if (buttonIndex === 1) pickFromGallery();
        },
      );
    } else {
      Alert.alert('Datei hochladen', '', [
        { text: 'Kamera', onPress: pickFromCamera },
        { text: 'Galerie', onPress: pickFromGallery },
        { text: 'Abbrechen', style: 'cancel' },
      ]);
    }
  }, []);

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      await uploadFile(result.assets[0]);
    }
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      await uploadFile(result.assets[0]);
    }
  };

  const uploadFile = async (asset: ImagePicker.ImagePickerAsset) => {
    const formData = new FormData();
    const uri = asset.uri;
    const filename = uri.split('/').pop() ?? 'upload';
    const type = asset.mimeType ?? 'image/jpeg';

    formData.append('file', { uri, name: filename, type } as unknown as Blob);
    formData.append('channelId', DEFAULT_CHANNEL_ID);

    try {
      await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      refetch();
    } catch {
      Alert.alert('Fehler', 'Datei konnte nicht hochgeladen werden');
    }
  };

  const renderFile = ({ item }: { item: ClubFile }) => (
    <Pressable
      onPress={() => handleFilePress(item)}
      style={({ pressed }) => [styles.fileRow, { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderBottomColor: colors.separator, opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={[styles.fileIcon, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name={getFileIcon(item.mimeType)} size={20} color={colors.textSecondary} />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={[typography.bodyMedium, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
          {formatFileSize(item.size)} · {formatDate(item.createdAt)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </Pressable>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Dateien', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.textPrimary, headerShadowVisible: false }} />
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
        <FlatList
          data={files}
          keyExtractor={(item) => item.id}
          renderItem={renderFile}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={!isLoading ? <EmptyState title="Keine Dateien" description="Noch keine Dateien hochgeladen" actionLabel="Datei hochladen" onAction={handleUpload} /> : null}
        />
        {files.length > 0 && (
          <View style={[styles.fab, { backgroundColor: colors.accent, borderRadius: radii.pill }]}>
            <Pressable onPress={handleUpload} style={styles.fabInner}>
              <Ionicons name="add" size={28} color={colors.textInverse} />
            </Pressable>
          </View>
        )}

        {/* Simple Image Viewer */}
        {viewerImage && (
          <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center' }]} onPress={() => setViewerImage(null)}>
            <Image source={{ uri: viewerImage }} style={{ width: '90%', height: '70%' }} resizeMode="contain" />
            <Pressable onPress={() => setViewerImage(null)} style={{ position: 'absolute', top: 60, right: 20 }}>
              <Ionicons name="close-circle" size={36} color={colors.textInverse} />
            </Pressable>
          </Pressable>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fileRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  fileIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', bottom: 100, right: 20, width: 56, height: 56 },
  fabInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
