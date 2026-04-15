import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../theme';
import {
  useEventForm,
  EVENT_TYPES,
  formatDisplayDateTime,
} from '../../features/calendar/hooks/useEventForm';

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  preselectedDate?: string | null;
}

export function CreateEventModal({ visible, onClose, preselectedDate }: CreateEventModalProps) {
  const { colors, typography, spacing, borderRadius, isDark } = useTheme();
  const form = useEventForm({ preselectedDate, onSuccess: onClose });

  return (
    <Modal
      visible={visible}
      presentationStyle="pageSheet"
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { padding: spacing.xl }]}>
          <Text style={[typography.h2, { color: colors.textPrimary }]} accessibilityRole="header">
            Neues Event
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityLabel="Modal schließen"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: 0 }}>
          {/* Titel */}
          <Text
            nativeID="event-title-label"
            style={[
              typography.captionMedium,
              { color: colors.textSecondary, marginBottom: spacing.xs },
            ]}
          >
            Titel
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
            value={form.title}
            onChangeText={form.setTitle}
            placeholder="Titel eingeben"
            placeholderTextColor={colors.textTertiary}
            accessibilityLabel="Titel"
            accessibilityLabelledBy="event-title-label"
          />

          {/* Typ */}
          <Text
            style={[
              typography.captionMedium,
              { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.xs },
            ]}
          >
            Typ
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -spacing.xl }}
            contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}
          >
            {EVENT_TYPES.map((et) => (
              <Pressable
                key={et.value}
                onPress={() => form.setType(et.value)}
                accessibilityLabel={et.label}
                accessibilityRole="button"
                accessibilityState={{ selected: form.type === et.value }}
                style={[
                  styles.typePill,
                  {
                    backgroundColor:
                      form.type === et.value ? colors.chipActive : colors.backgroundSecondary,
                    borderRadius: borderRadius.full,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: form.type === et.value ? colors.textInverse : colors.textPrimary,
                      fontWeight: '600',
                    },
                  ]}
                >
                  {et.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Beschreibung */}
          <Text
            nativeID="event-desc-label"
            style={[
              typography.captionMedium,
              { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.xs },
            ]}
          >
            Beschreibung
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.multiline,
              {
                backgroundColor: colors.backgroundSecondary,
                borderRadius: borderRadius.md,
                color: colors.textPrimary,
              },
            ]}
            value={form.description}
            onChangeText={form.setDescription}
            placeholder="Beschreibung (optional)"
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            accessibilityLabel="Beschreibung"
            accessibilityLabelledBy="event-desc-label"
          />

          {/* Startdatum */}
          <Text
            style={[
              typography.captionMedium,
              { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.xs },
            ]}
          >
            Start
          </Text>
          <Pressable
            onPress={form.openStartPicker}
            accessibilityLabel={`Startdatum: ${formatDisplayDateTime(form.startDate)}`}
            accessibilityRole="button"
            style={[
              styles.input,
              {
                backgroundColor: colors.backgroundSecondary,
                borderRadius: borderRadius.md,
                flexDirection: 'row',
                alignItems: 'center',
              },
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={colors.textPrimary}
              style={{ marginRight: spacing.sm }}
            />
            <Text style={[typography.body, { color: colors.textPrimary }]}>
              {formatDisplayDateTime(form.startDate)}
            </Text>
          </Pressable>
          {form.showStartPicker && (
            <View
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: borderRadius.md,
                marginTop: spacing.xs,
                overflow: 'hidden',
              }}
            >
              <DateTimePicker
                value={form.startDate}
                mode={Platform.OS === 'ios' ? 'datetime' : form.startPickerMode}
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                locale="de-DE"
                themeVariant={isDark ? 'dark' : 'light'}
                accentColor={colors.accent}
                onChange={form.handleStartDateChange}
              />
              {Platform.OS === 'ios' && (
                <Pressable
                  onPress={() => form.setShowStartPicker(false)}
                  accessibilityLabel="Startdatum bestätigen"
                  accessibilityRole="button"
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: colors.accent,
                      borderRadius: borderRadius.md,
                      margin: spacing.md,
                    },
                  ]}
                >
                  <Text style={[typography.buttonSmall, { color: colors.textInverse }]}>
                    Fertig
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Enddatum */}
          <Text
            style={[
              typography.captionMedium,
              { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.xs },
            ]}
          >
            Ende (optional)
          </Text>
          <Pressable
            onPress={form.openEndPicker}
            accessibilityLabel={
              form.endDate
                ? `Enddatum: ${formatDisplayDateTime(form.endDate)}`
                : 'Enddatum hinzufügen'
            }
            accessibilityRole="button"
            style={[
              styles.input,
              {
                backgroundColor: colors.backgroundSecondary,
                borderRadius: borderRadius.md,
                flexDirection: 'row',
                alignItems: 'center',
              },
            ]}
          >
            <Ionicons
              name="time-outline"
              size={18}
              color={form.endDate ? colors.textPrimary : colors.textTertiary}
              style={{ marginRight: spacing.sm }}
            />
            <Text
              style={[
                typography.body,
                { color: form.endDate ? colors.textPrimary : colors.textTertiary, flex: 1 },
              ]}
            >
              {form.endDate ? formatDisplayDateTime(form.endDate) : 'Enddatum hinzufuegen'}
            </Text>
            {form.endDate && (
              <Pressable
                onPress={form.clearEndDate}
                hitSlop={12}
                accessibilityLabel="Enddatum entfernen"
                accessibilityRole="button"
              >
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </Pressable>
            )}
          </Pressable>
          {form.showEndPicker && form.endDate && (
            <View
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: borderRadius.md,
                marginTop: spacing.xs,
                overflow: 'hidden',
              }}
            >
              <DateTimePicker
                value={form.endDate}
                mode={Platform.OS === 'ios' ? 'datetime' : 'time'}
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                minimumDate={form.startDate}
                locale="de-DE"
                themeVariant={isDark ? 'dark' : 'light'}
                accentColor={colors.accent}
                onChange={form.handleEndDateChange}
              />
              {Platform.OS === 'ios' && (
                <Pressable
                  onPress={() => form.setShowEndPicker(false)}
                  accessibilityLabel="Enddatum bestätigen"
                  accessibilityRole="button"
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: colors.accent,
                      borderRadius: borderRadius.md,
                      margin: spacing.md,
                    },
                  ]}
                >
                  <Text style={[typography.buttonSmall, { color: colors.textInverse }]}>
                    Fertig
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Ort + Platz */}
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
            <View style={{ flex: 2 }}>
              <Text
                nativeID="event-location-label"
                style={[
                  typography.captionMedium,
                  { color: colors.textSecondary, marginBottom: spacing.xs },
                ]}
              >
                Ort
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
                value={form.location}
                onChangeText={form.setLocation}
                placeholder="z.B. TC Much"
                placeholderTextColor={colors.textTertiary}
                accessibilityLabel="Ort"
                accessibilityLabelledBy="event-location-label"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                nativeID="event-court-label"
                style={[
                  typography.captionMedium,
                  { color: colors.textSecondary, marginBottom: spacing.xs },
                ]}
              >
                Platz
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
                value={form.court}
                onChangeText={form.setCourt}
                placeholder="z.B. 1"
                placeholderTextColor={colors.textTertiary}
                accessibilityLabel="Platznummer"
                accessibilityLabelledBy="event-court-label"
              />
            </View>
          </View>

          {/* Erstellen Button */}
          <Pressable
            onPress={form.handleCreate}
            disabled={!form.canSubmit}
            accessibilityLabel="Event erstellen"
            accessibilityRole="button"
            accessibilityState={{ disabled: !form.canSubmit, busy: form.isPending }}
            style={[
              styles.actionBtn,
              {
                backgroundColor: form.canSubmit ? colors.accent : colors.surface,
                borderRadius: borderRadius.md,
                marginTop: spacing.xxl,
              },
            ]}
          >
            <Text
              style={[
                typography.buttonSmall,
                { color: form.canSubmit ? colors.textInverse : colors.textTertiary },
              ]}
            >
              Event erstellen
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: { height: 48, paddingHorizontal: 16, fontSize: 15, justifyContent: 'center' },
  multiline: { height: 100, paddingTop: 12, paddingBottom: 12 },
  typePill: { paddingHorizontal: 14, paddingVertical: 8 },
  actionBtn: { height: 48, alignItems: 'center', justifyContent: 'center' },
});
