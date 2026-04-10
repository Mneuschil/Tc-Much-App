import { useState } from 'react';
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
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../../theme';
import { useCreateEvent } from '../../features/calendar/hooks/useEvents';
import type { CreateEventInput } from '@tennis-club/shared';

const EVENT_TYPES: { value: CreateEventInput['type']; label: string }[] = [
  { value: 'TRAINING', label: 'Training' },
  { value: 'LEAGUE_MATCH', label: 'Ligaspiel' },
  { value: 'CUP_MATCH', label: 'Pokalspiel' },
  { value: 'CLUB_EVENT', label: 'Vereinsevent' },
  { value: 'CLUB_CHAMPIONSHIP', label: 'Clubmeisterschaft' },
  { value: 'RANKING_MATCH', label: 'Ranglistenspiel' },
  { value: 'TOURNAMENT', label: 'Turnier' },
];

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  preselectedDate?: string | null;
}

export function CreateEventModal({ visible, onClose, preselectedDate }: CreateEventModalProps) {
  const { colors, typography, spacing, borderRadius, isDark } = useTheme();
  const createEvent = useCreateEvent();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CreateEventInput['type']>('CLUB_EVENT');
  const [location, setLocation] = useState('');
  const [court, setCourt] = useState('');
  const [startDate, setStartDate] = useState<Date>(() => {
    if (preselectedDate) {
      const d = new Date(preselectedDate);
      d.setHours(10, 0, 0, 0);
      return d;
    }
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d;
  });
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [startPickerMode, setStartPickerMode] = useState<'date' | 'time'>('date');

  const formatDisplayDateTime = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  const handleStartDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
      if (selected && startPickerMode === 'date') {
        setStartDate(selected);
        setStartPickerMode('time');
        setShowStartPicker(true);
        return;
      }
    }
    if (selected) setStartDate(selected);
  };

  const handleEndDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowEndPicker(false);
    if (selected) setEndDate(selected);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('CLUB_EVENT');
    setLocation('');
    setCourt('');
    setEndDate(null);
    setShowStartPicker(false);
    setShowEndPicker(false);
  };

  const handleCreate = () => {
    if (!title.trim()) return;
    const input: CreateEventInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      location: location.trim() || undefined,
      court: court.trim() || undefined,
      startDate: startDate.toISOString(),
      endDate: endDate ? endDate.toISOString() : undefined,
    };
    createEvent.mutate(input, {
      onSuccess: () => {
        resetForm();
        onClose();
      },
    });
  };

  const canSubmit = title.trim().length > 0 && !createEvent.isPending;

  return (
    <Modal
      visible={visible}
      presentationStyle="pageSheet"
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: spacing.xl,
          }}
        >
          <Text style={[typography.h2, { color: colors.textPrimary }]}>Neues Event</Text>
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
            value={title}
            onChangeText={setTitle}
            placeholder="Titel eingeben"
            placeholderTextColor={colors.textTertiary}
            accessibilityLabel="Titel"
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
                onPress={() => setType(et.value)}
                accessibilityLabel={et.label}
                accessibilityRole="button"
                accessibilityState={{ selected: type === et.value }}
                style={[
                  styles.typePill,
                  {
                    backgroundColor:
                      type === et.value ? colors.chipActive : colors.backgroundSecondary,
                    borderRadius: borderRadius.full,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: type === et.value ? colors.textInverse : colors.textPrimary,
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
            value={description}
            onChangeText={setDescription}
            placeholder="Beschreibung (optional)"
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            accessibilityLabel="Beschreibung"
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
            onPress={() => {
              setStartPickerMode('date');
              setShowStartPicker(true);
            }}
            accessibilityLabel={`Startdatum: ${formatDisplayDateTime(startDate)}`}
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
              {formatDisplayDateTime(startDate)}
            </Text>
          </Pressable>
          {showStartPicker && (
            <View
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: borderRadius.md,
                marginTop: spacing.xs,
                overflow: 'hidden',
              }}
            >
              <DateTimePicker
                value={startDate}
                mode={Platform.OS === 'ios' ? 'datetime' : startPickerMode}
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                locale="de-DE"
                themeVariant={isDark ? 'dark' : 'light'}
                accentColor={colors.accent}
                onChange={handleStartDateChange}
              />
              {Platform.OS === 'ios' && (
                <Pressable
                  onPress={() => setShowStartPicker(false)}
                  accessibilityLabel="Startdatum bestätigen"
                  accessibilityRole="button"
                  style={[
                    styles.doneBtn,
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
            onPress={() => {
              if (!endDate) setEndDate(new Date(startDate.getTime() + 90 * 60000));
              setShowEndPicker(true);
            }}
            accessibilityLabel={
              endDate ? `Enddatum: ${formatDisplayDateTime(endDate)}` : 'Enddatum hinzufügen'
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
              color={endDate ? colors.textPrimary : colors.textTertiary}
              style={{ marginRight: spacing.sm }}
            />
            <Text
              style={[
                typography.body,
                { color: endDate ? colors.textPrimary : colors.textTertiary, flex: 1 },
              ]}
            >
              {endDate ? formatDisplayDateTime(endDate) : 'Enddatum hinzufuegen'}
            </Text>
            {endDate && (
              <Pressable
                onPress={() => {
                  setEndDate(null);
                  setShowEndPicker(false);
                }}
                hitSlop={12}
                accessibilityLabel="Enddatum entfernen"
                accessibilityRole="button"
              >
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </Pressable>
            )}
          </Pressable>
          {showEndPicker && endDate && (
            <View
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: borderRadius.md,
                marginTop: spacing.xs,
                overflow: 'hidden',
              }}
            >
              <DateTimePicker
                value={endDate}
                mode={Platform.OS === 'ios' ? 'datetime' : 'time'}
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                minimumDate={startDate}
                locale="de-DE"
                themeVariant={isDark ? 'dark' : 'light'}
                accentColor={colors.accent}
                onChange={handleEndDateChange}
              />
              {Platform.OS === 'ios' && (
                <Pressable
                  onPress={() => setShowEndPicker(false)}
                  accessibilityLabel="Enddatum bestätigen"
                  accessibilityRole="button"
                  style={[
                    styles.doneBtn,
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
                value={location}
                onChangeText={setLocation}
                placeholder="z.B. TC Much"
                placeholderTextColor={colors.textTertiary}
                accessibilityLabel="Ort"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
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
                value={court}
                onChangeText={setCourt}
                placeholder="z.B. 1"
                placeholderTextColor={colors.textTertiary}
                accessibilityLabel="Platznummer"
              />
            </View>
          </View>

          {/* Erstellen Button */}
          <Pressable
            onPress={handleCreate}
            disabled={!canSubmit}
            accessibilityLabel="Event erstellen"
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit }}
            style={[
              styles.doneBtn,
              {
                backgroundColor: canSubmit ? colors.accent : colors.surface,
                borderRadius: borderRadius.md,
                marginTop: spacing.xxl,
              },
            ]}
          >
            <Text
              style={[
                typography.buttonSmall,
                { color: canSubmit ? colors.textInverse : colors.textTertiary },
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
  input: { height: 48, paddingHorizontal: 16, fontSize: 15, justifyContent: 'center' },
  multiline: { height: 100, paddingTop: 12, paddingBottom: 12 },
  typePill: { paddingHorizontal: 14, paddingVertical: 8 },
  doneBtn: { height: 48, alignItems: 'center', justifyContent: 'center' },
});
