import React, { useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../theme';
import { Button } from '../ui/Button';
import { FilterPill } from '../ui/FilterPill';
import { useSubmitMedia } from '../../hooks/useForms';

const CATEGORIES = ['Vereinsleben', 'Training', 'Turniere', 'Platzanlage', 'Sonstiges'];

export function MediaUploadForm() {
  const { colors, spacing, radii, typography } = useTheme();
  const mutation = useSubmitMedia();

  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [category, setCategory] = useState('Vereinsleben');
  const [submitted, setSubmitted] = useState(false);

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!mediaUri) return;

    const formData = new FormData();
    formData.append('category', category);
    formData.append('media', {
      uri: mediaUri,
      type: 'image/jpeg',
      name: 'media-upload.jpg',
    } as unknown as Blob);

    mutation.mutate(formData, { onSuccess: () => setSubmitted(true) });
  };

  if (submitted) {
    return (
      <View style={[styles.successCard, { backgroundColor: colors.successSurface, borderRadius: radii.md, padding: spacing.xxl }]}>
        <Ionicons name="checkmark-circle" size={48} color={colors.success} />
        <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing.md, textAlign: 'center' }]}>
          Upload erfolgreich
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.s, textAlign: 'center' }]}>
          Dein Medium wurde hochgeladen
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl }}>
      {/* Media Picker */}
      <View>
        <Text style={[typography.bodyMedium, { color: colors.textPrimary, marginBottom: spacing.s }]}>Foto oder Video</Text>
        {mediaUri ? (
          <View>
            <Image source={{ uri: mediaUri }} style={[styles.preview, { borderRadius: radii.md }]} />
            <Pressable
              onPress={() => setMediaUri(null)}
              style={[styles.removeBtn, { backgroundColor: colors.dangerSurface, borderRadius: radii.pill }]}
            >
              <Ionicons name="close" size={18} color={colors.danger} />
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={pickMedia} style={[styles.placeholder, { borderRadius: radii.md, borderColor: colors.textTertiary }]}>
            <Ionicons name="cloud-upload-outline" size={32} color={colors.textTertiary} />
            <Text style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.xs }]}>Medium auswählen</Text>
          </Pressable>
        )}
      </View>

      {/* Kategorie */}
      <View>
        <Text style={[typography.bodyMedium, { color: colors.textPrimary, marginBottom: spacing.s }]}>Kategorie</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((cat) => (
            <FilterPill key={cat} label={cat} isActive={category === cat} onPress={() => setCategory(cat)} />
          ))}
        </View>
      </View>

      {/* Submit */}
      <Button
        title="Hochladen"
        onPress={handleSubmit}
        variant="primary"
        fullWidth
        loading={mutation.isPending}
        disabled={!mediaUri}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    height: 150,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: { width: '100%', height: 200, resizeMode: 'cover' },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  successCard: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
});
