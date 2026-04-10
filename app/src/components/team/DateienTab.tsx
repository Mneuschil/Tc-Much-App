import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  ActionSheetIOS,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { EmptyState, LoadingSkeleton } from '../ui';
import {
  useChannelFiles,
  useFolders,
  useUploadFile,
  useCreateFolder,
  useDeleteFile,
} from '../../features/files/hooks/useFiles';
import { useFileUploadFlow } from '../../features/files/hooks/useFileUploadFlow';
import { API_URL } from '../../lib/constants';
import { FileRow, type FileData } from './FileRow';
import { FolderRow, type FolderData } from './FolderRow';
import { FileUploadModal } from './FileUploadModal';
import { FolderCreateModal } from './FolderCreateModal';
import { ImageViewerModal } from './ImageViewerModal';

function getFullUrl(relativeUrl: string): string {
  const baseUrl = API_URL.replace('/api/v1', '');
  return `${baseUrl}${relativeUrl}`;
}

interface DateienTabProps {
  channelId: string | undefined | null;
  isCreatingChannel?: boolean;
}

export function DateienTab({ channelId, isCreatingChannel }: DateienTabProps) {
  const { colors, typography, spacing, radii } = useTheme();
  const insets = useSafeAreaInsets();

  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [currentFolderName, setCurrentFolderName] = useState<string | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const {
    data: filesData,
    isLoading: filesLoading,
    refetch: refetchFiles,
  } = useChannelFiles(channelId ?? '', currentFolderId);
  const { data: foldersData, refetch: refetchFolders } = useFolders(channelId ?? '');
  const uploadFile = useUploadFile();
  const createFolder = useCreateFolder();
  const deleteFile = useDeleteFile();
  const uploadFlow = useFileUploadFlow();

  const files = (filesData ?? []) as FileData[];
  const folders = currentFolderId ? [] : ((foldersData ?? []) as FolderData[]);

  const handleFilePress = (file: FileData) => {
    if (file.mimeType.startsWith('image/')) {
      setViewerImage(getFullUrl(file.url));
    } else {
      Linking.openURL(getFullUrl(file.url));
    }
  };

  const handleUploadConfirm = (displayName: string) => {
    if (!uploadFlow.pendingAsset || !channelId) return;
    uploadFile.mutate(
      {
        uri: uploadFlow.pendingAsset.uri,
        fileName: uploadFlow.pendingAsset.originalName,
        mimeType: uploadFlow.pendingAsset.mimeType,
        displayName,
        channelId,
        folderId: currentFolderId,
      },
      {
        onSuccess: () => {
          uploadFlow.clearPendingAsset();
          refetchFiles();
        },
      },
    );
  };

  const handleFAB = () => {
    const options = ['Datei hochladen', 'Ordner erstellen', 'Abbrechen'];
    const cancelButtonIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex }, (buttonIndex) => {
        if (buttonIndex === 0) uploadFlow.showUploadSourcePicker();
        if (buttonIndex === 1) setShowFolderModal(true);
      });
    } else {
      Alert.alert('Aktion wählen', '', [
        { text: 'Datei hochladen', onPress: uploadFlow.showUploadSourcePicker },
        { text: 'Ordner erstellen', onPress: () => setShowFolderModal(true) },
        { text: 'Abbrechen', style: 'cancel' },
      ]);
    }
  };

  const handleCreateFolder = (name: string) => {
    if (!channelId) return;
    createFolder.mutate({ name, channelId }, { onSuccess: () => setShowFolderModal(false) });
  };

  if (!channelId) {
    if (isCreatingChannel) {
      return (
        <View style={styles.emptyWrap}>
          <LoadingSkeleton width={200} height={20} />
        </View>
      );
    }
    return <EmptyState title="Keine Dateien" description="Kein Kanal verknüpft" />;
  }

  return (
    <View style={{ flex: 1 }}>
      {currentFolderName && (
        <Pressable
          onPress={() => {
            setCurrentFolderId(undefined);
            setCurrentFolderName(null);
          }}
          accessibilityLabel="Zurück zum übergeordneten Ordner"
          accessibilityRole="button"
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
            backgroundColor: colors.backgroundSecondary,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="arrow-back" size={18} color={colors.accent} />
          <Ionicons
            name="folder"
            size={16}
            color={colors.accent}
            style={{ marginLeft: spacing.sm }}
          />
          <Text style={[typography.bodyMedium, { color: colors.accent, marginLeft: spacing.xs }]}>
            {currentFolderName}
          </Text>
        </Pressable>
      )}

      <FlashList
        data={files}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={filesLoading}
            onRefresh={() => {
              refetchFiles();
              refetchFolders();
            }}
            tintColor={colors.accent}
          />
        }
        ListHeaderComponent={
          folders.length > 0 ? (
            <View>
              {folders.map((folder) => (
                <FolderRow
                  key={folder.id}
                  folder={folder}
                  onPress={(f) => {
                    setCurrentFolderId(f.id);
                    setCurrentFolderName(f.name);
                  }}
                />
              ))}
              {files.length > 0 && (
                <View
                  style={{
                    paddingHorizontal: spacing.xl,
                    paddingTop: spacing.lg,
                    paddingBottom: spacing.sm,
                  }}
                >
                  <Text style={[typography.captionMedium, { color: colors.textSecondary }]}>
                    Dateien
                  </Text>
                </View>
              )}
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <FileRow
            file={item}
            onPress={handleFilePress}
            onDelete={(f) => deleteFile.mutate(f.id, { onSuccess: () => refetchFiles() })}
          />
        )}
        ListEmptyComponent={
          folders.length === 0 ? (
            <EmptyState
              title={currentFolderName ? 'Ordner leer' : 'Keine Dateien'}
              description={
                currentFolderName
                  ? 'Noch keine Dateien in diesem Ordner'
                  : 'Lade Dateien hoch oder erstelle Ordner'
              }
            />
          ) : null
        }
      />

      <Pressable
        onPress={handleFAB}
        accessibilityLabel="Datei oder Ordner hinzufügen"
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.fab,
          {
            bottom: Math.max(20 - insets.bottom, 4),
            backgroundColor: colors.accent,
            borderRadius: radii.pill,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </Pressable>

      <FileUploadModal
        visible={uploadFlow.showUploadModal}
        onClose={uploadFlow.clearPendingAsset}
        onUpload={handleUploadConfirm}
        isPending={uploadFile.isPending}
        filePreview={uploadFlow.pendingAsset}
      />

      <FolderCreateModal
        visible={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onCreate={handleCreateFolder}
        isPending={createFolder.isPending}
      />

      <ImageViewerModal imageUrl={viewerImage} onClose={() => setViewerImage(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: { paddingTop: 60, alignItems: 'center' },
});
