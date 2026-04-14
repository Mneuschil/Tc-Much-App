import React from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Button } from '../ui/Button';
import { FilterPill } from '../ui/FilterPill';
import { Urgency } from '@tennis-club/shared';
import { useCourtDamageForm } from './useCourtDamageForm';
import { DamageSuccessCard } from './DamageSuccessCard';

const COURTS = ['1', '2', '3', '4', '5'];
const URGENCY_OPTIONS: { value: Urgency; label: string }[] = [
  { value: Urgency.LOW, label: 'Niedrig' },
  { value: Urgency.MEDIUM, label: 'Mittel' },
  { value: Urgency.HIGH, label: 'Hoch' },
];

export function CourtDamageForm() {
  const { colors, spacing, radii, typography } = useTheme();
  const form = useCourtDamageForm();

  if (form.submitted) {
    return <DamageSuccessCard />;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl }}>
      <View>
        <Text
          style={[typography.bodyMedium, { color: colors.textPrimary, marginBottom: spacing.s }]}
        >
          Platznummer
        </Text>
        <View style={styles.courtRow}>
          {COURTS.map((c) => (
            <FilterPill
              key={c}
              label={c}
              isActive={form.courtNumber === c}
              onPress={() => form.setCourtNumber(c)}
            />
          ))}
        </View>
      </View>

      <View>
        <Text
          nativeID="damage-desc-label"
          style={[typography.bodyMedium, { color: colors.textPrimary, marginBottom: spacing.s }]}
        >
          Beschreibung
        </Text>
        <TextInput
          value={form.description}
          onChangeText={form.setDescription}
          multiline
          placeholder="Beschreibe den Schaden..."
          placeholderTextColor={colors.textTertiary}
          accessibilityLabel="Schadensbeschreibung"
          accessibilityLabelledBy="damage-desc-label"
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

      <View>
        <Text
          style={[typography.bodyMedium, { color: colors.textPrimary, marginBottom: spacing.s }]}
        >
          Foto
        </Text>
        {form.photoUri ? (
          <View>
            <Image
              source={{ uri: form.photoUri }}
              style={[styles.preview, { borderRadius: radii.md }]}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              accessibilityElementsHidden
            />
            <Pressable
              onPress={() => form.setPhotoUri(null)}
              accessibilityLabel="Foto entfernen"
              accessibilityRole="button"
              style={[
                styles.removeBtn,
                { backgroundColor: colors.dangerSurface, borderRadius: radii.pill },
              ]}
            >
              <Ionicons name="close" size={18} color={colors.danger} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={form.pickImage}
            accessibilityLabel="Foto aufnehmen oder auswählen"
            accessibilityRole="button"
            style={[
              styles.photoPlaceholder,
              { borderRadius: radii.md, borderColor: colors.textTertiary },
            ]}
          >
            <Ionicons name="camera-outline" size={32} color={colors.textTertiary} />
            <Text
              style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.xs }]}
            >
              Foto aufnehmen oder auswählen
            </Text>
          </Pressable>
        )}
      </View>

      <View>
        <Text
          style={[typography.bodyMedium, { color: colors.textPrimary, marginBottom: spacing.s }]}
        >
          Dringlichkeit
        </Text>
        <View style={styles.urgencyRow}>
          {URGENCY_OPTIONS.map((opt) => {
            const isActive = form.urgency === opt.value;
            const bg =
              opt.value === 'LOW'
                ? colors.backgroundSecondary
                : opt.value === 'MEDIUM'
                  ? colors.warningSurface
                  : colors.dangerSurface;
            const borderColor =
              opt.value === 'MEDIUM'
                ? colors.warning
                : opt.value === 'HIGH'
                  ? colors.danger
                  : 'transparent';

            return (
              <Pressable
                key={opt.value}
                onPress={() => form.setUrgency(opt.value)}
                accessibilityLabel={`Dringlichkeit: ${opt.label}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                style={[
                  styles.urgencyBtn,
                  {
                    backgroundColor: bg,
                    borderRadius: radii.md,
                    borderWidth: isActive ? 2 : 1,
                    borderColor: isActive
                      ? borderColor
                      : opt.value === 'LOW'
                        ? 'transparent'
                        : borderColor,
                    opacity: isActive ? 1 : 0.6,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.urgencyLabel,
                    { color: colors.textPrimary, fontWeight: isActive ? '700' : '500' },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Button
        title="Meldung absenden"
        onPress={form.handleSubmit}
        variant="primary"
        fullWidth
        loading={form.isPending}
        disabled={!form.isValid}
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
  preview: { width: '100%', height: 200 },
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
});
