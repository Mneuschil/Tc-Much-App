import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../../theme';

interface MessageMediaGridProps {
  urls: string[];
  onMediaPress: (url: string) => void;
}

export function MessageMediaGrid({ urls, onMediaPress }: MessageMediaGridProps) {
  const { borderRadius } = useTheme();

  if (urls.length === 1) {
    return (
      <Pressable
        onPress={() => onMediaPress(urls[0])}
        style={styles.mediaMargin}
        accessibilityLabel="Bild ansehen"
        accessibilityRole="button"
      >
        <Image
          source={{ uri: urls[0] }}
          style={[styles.singleMedia, { borderRadius: borderRadius.md }]}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          accessibilityElementsHidden
        />
      </Pressable>
    );
  }

  const visible = urls.slice(0, 4);
  const extra = urls.length - 4;

  return (
    <View style={styles.gridContainer}>
      {visible.map((url, idx) => (
        <Pressable
          key={idx}
          onPress={() => onMediaPress(url)}
          style={styles.mediaItem}
          accessibilityLabel={`Bild ${idx + 1} ansehen`}
          accessibilityRole="button"
        >
          <Image
            source={{ uri: url }}
            style={[styles.gridImage, { borderRadius: borderRadius.sm }]}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            recyclingKey={`media-${idx}`}
            accessibilityElementsHidden
          />
          {idx === 3 && extra > 0 && (
            <View style={[styles.overlay, { borderRadius: borderRadius.sm }]}>
              <Text style={styles.overlayText}>+{extra}</Text>
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  mediaMargin: { marginTop: 4 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginTop: 4 },
  singleMedia: { width: '100%', height: 180 },
  mediaItem: { width: '48.5%', height: 100 },
  gridImage: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
