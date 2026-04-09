import { View, Text, Image, Dimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface PhotoGridProps {
  photos: string[];
}

export function PhotoGrid({ photos }: PhotoGridProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const imageWidth = (Dimensions.get('window').width - spacing.xl * 2 - spacing.sm) / 2;

  if (photos.length === 0) {
    return (
      <View style={styles.emptyPhotos}>
        <Ionicons name="camera-outline" size={32} color={colors.textTertiary} />
        <Text
          style={[
            typography.bodySmall,
            { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
          ]}
        >
          Noch keine Bilder vorhanden.{'\n'}Lade Fotos vom Spieltag hoch!
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.photoGrid, { gap: spacing.sm }]}>
      {photos.map((uri, i) => (
        <Image
          key={i}
          source={{ uri }}
          style={{ width: imageWidth, height: imageWidth, borderRadius: borderRadius.lg }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  emptyPhotos: { alignItems: 'center', paddingVertical: 40 },
});
