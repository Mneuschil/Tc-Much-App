import { Modal, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface ImageViewerModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export function ImageViewerModal({ imageUrl, onClose }: ImageViewerModalProps) {
  if (!imageUrl) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={styles.overlay}
        onPress={onClose}
        accessibilityLabel="Bildansicht schließen"
        accessibilityRole="button"
      >
        <Pressable
          onPress={onClose}
          style={styles.closeButton}
          accessibilityLabel="Schließen"
          accessibilityRole="button"
        >
          <Ionicons name="close-circle" size={36} color="#FFFFFF" />
        </Pressable>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="contain"
          transition={200}
          cachePolicy="memory-disk"
          accessibilityLabel="Vergrößertes Bild"
          accessibilityRole="image"
        />
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: { position: 'absolute', top: 60, right: 20, zIndex: 1 },
  image: { width: '90%', height: '70%' },
});
