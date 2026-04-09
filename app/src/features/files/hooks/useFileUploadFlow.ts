import { useState, useCallback } from 'react';
import { ActionSheetIOS, Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface PendingAsset {
  uri: string;
  mimeType: string;
  originalName: string;
}

export function useFileUploadFlow() {
  const [pendingAsset, setPendingAsset] = useState<PendingAsset | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handlePickComplete = useCallback((asset: ImagePicker.ImagePickerAsset) => {
    const uri = asset.uri;
    const originalName = uri.split('/').pop() ?? 'upload';
    const mimeType = asset.mimeType ?? 'image/jpeg';
    setPendingAsset({ uri, mimeType, originalName });
    setShowUploadModal(true);
  }, []);

  const pickFromCamera = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      handlePickComplete(result.assets[0]);
    }
  }, [handlePickComplete]);

  const pickFromGallery = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      handlePickComplete(result.assets[0]);
    }
  }, [handlePickComplete]);

  const showUploadSourcePicker = useCallback(() => {
    const options = ['Kamera', 'Galerie', 'Abbrechen'];
    const cancelButtonIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex }, (buttonIndex) => {
        if (buttonIndex === 0) pickFromCamera();
        if (buttonIndex === 1) pickFromGallery();
      });
    } else {
      Alert.alert('Quelle wählen', '', [
        { text: 'Kamera', onPress: pickFromCamera },
        { text: 'Galerie', onPress: pickFromGallery },
        { text: 'Abbrechen', style: 'cancel' },
      ]);
    }
  }, [pickFromCamera, pickFromGallery]);

  const clearPendingAsset = useCallback(() => {
    setShowUploadModal(false);
    setPendingAsset(null);
  }, []);

  return {
    pendingAsset,
    showUploadModal,
    setShowUploadModal,
    showUploadSourcePicker,
    clearPendingAsset,
  };
}
