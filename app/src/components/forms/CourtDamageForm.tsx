import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../theme';
import { Button } from '../ui/Button';
import { FilterPill } from '../ui/FilterPill';
import { useSubmitCourtDamage } from '../../hooks/useForms';
import { Urgency } from '@tennis-club/shared';

const COURTS = ['1', '2', '3', '4', '5'];
const URGENCY_OPTIONS: { value: Urgency; label: string }[] = [
  { value: Urgency.LOW, label: 'Niedrig' },
  { value: Urgency.MEDIUM, label: 'Mittel' },
  { value: Urgency.HIGH, label: 'Hoch' },
];

export function CourtDamageForm() {
  const { colors, spacing, radii, typography } = useTheme();
  const mutation = useSubmitCourtDamage();

  const [courtNumber, setCourtNumber] = useState('');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [urgency, setUrgency] = useState<Urgency>(Urgency.LOW);
  const [submitted, setSubmitted] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!courtNumber || !description || !photoUri) return;

    const formData = new FormData();
    formData.append('courtNumber', courtNumber);
    formData.append('description', description);
    formData.append('urgency', urgency);
    formData.append('photo', {
      uri: photoUri,
      type: 'image/jpeg',
      name: 'court-damage.jpg',
    } as unknown as Blob);

    mutation.mutate(formData, { onSuccess: () => setSubmitted(true) });
  };

  const isValid = courtNumber !== '' && description.trim().length > 0 && photoUri !== null;

  if (submitted) {
    return (
      <View style={[styles.successCard, { backgroundColor: colors.successSurface, borderRadius: radii.md, padding: spacing.xxl }]}>
        <Ionicons name="checkmark-circle" size={48} color={colors.success} />
        <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing.md, textAlign: 'center' }]}>
          Meldung eingereicht
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.s, textAlign: 'center' }]}>
          Du wirst über den Status informiert
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl }}>
      {/* Platz-Nr */}
      <View>
        <Text style={[typography.bodyMedium, { color: colors.textPrimary, marginBottom: spacing.s }]}>Platznummer</Text>
        <View style={styles.courtRow}>
          {COURTS.map((c) => (
            <FilterPill key={c} label={c} isActive={courtNumber === c} onPress={() => setCourtNumber(c)} />
          ))}
        </View>
      </View>

      {/* Beschreibung */}
      <View>
        <Text style={[typography.bodyMedium, { color: colors.textPrimary, marginBottom: spacing.s }]}>Beschreibung</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Beschreibe den Schaden..."
          placeholderTextColor={colors.textTertiary}
          style={[
            styles.textArea,
            {
              backgroundColor: colors.backgroundSecondary,
              borderRadius: radii.md,
              color: colors.textPrimary,
              padding: spacing.md,
              fontSize: 15,
            },
          ]}
        />
      </View>

      {/* Foto */}
      <View>
        <Text style={[typography.bodyMedium, { color: colors.textPrimary, marginBottom: spacing.s }]}>Foto</Text>
        {photoUri ? (
          <View>
            <Image source={{ uri: photoUri }} style={[styles.preview, { borderRadius: radii.md }]} />
            <Pressable
              onPress={() => setPhotoUri(null)}
              style={[styles.removeBtn, { backgroundColor: colors.dangerSurface, borderRadius: radii.pill }]}
            >
              <Ionicons name="close" size={18} color={colors.danger} />
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={pickImage} style={[styles.photoPlaceholder, { borderRadius: radii.md, borderColor: colors.textTertiary }]}>
            <Ionicons name="camera-outline" size={32} color={colors.textTertiary} />
            <Text style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.xs }]}>Foto hinzufügen</Text>
          </Pressable>
        )}
      </View>

      {/* Dringlichkeit */}
      <View>
        <Text style={[typography.bodyMedium, { color: colors.textPrimary, marginBottom: spacing.s }]}>Dringlichkeit</Text>
        <View style={styles.urgencyRow}>
          {URGENCY_OPTIONS.map((opt) => {
            const isActive = urgency === opt.value;
            const bg = opt.value === 'LOW'
              ? colors.backgroundSecondary
              : opt.value === 'MEDIUM'
                ? colors.warningSurface
                : colors.dangerSurface;
            const borderColor = opt.value === 'MEDIUM'
              ? colors.warning
              : opt.value === 'HIGH'
                ? colors.danger
                : 'transparent';

            return (
              <Pressable
                key={opt.value}
                onPress={() => setUrgency(opt.value)}
                style={[
                  styles.urgencyBtn,
                  {
                    backgroundColor: bg,
                    borderRadius: radii.md,
                    borderWidth: isActive ? 2 : 1,
                    borderColor: isActive ? borderColor : (opt.value === 'LOW' ? 'transparent' : borderColor),
                    opacity: isActive ? 1 : 0.6,
                  },
                ]}
              >
                <Text style={[styles.urgencyLabel, { color: colors.textPrimary, fontWeight: isActive ? '700' : '500' }]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Submit */}
      <Button
        title="Meldung absenden"
        onPress={handleSubmit}
        variant="primary"
        fullWidth
        loading={mutation.isPending}
        disabled={!isValid}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  courtRow: { flexDirection: 'row', gap: 8 },
  textArea: { height: 100, textAlignVertical: 'top' },
  photoPlaceholder: {
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
  urgencyRow: { flexDirection: 'row', gap: 8 },
  urgencyBtn: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' },
  urgencyLabel: { fontSize: 14 },
  successCard: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
});
