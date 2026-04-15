import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../../theme';
import { useTeams } from '../../teams/hooks/useTeams';
import { useCreateBooking } from '../hooks/useCreateBooking';
import {
  COURTS,
  CATEGORY_LABEL,
  TRAINING_TYPE_LABEL,
  HOUR_START,
  HOUR_END,
} from '../utils/courtConstants';
import type {
  CourtCategory,
  CreateCourtBookingInput,
  TrainingType,
} from '../services/courtsService';

interface CreateBookingModalProps {
  visible: boolean;
  onClose: () => void;
  initialDate?: Date;
}

type BookingCategory = Exclude<CourtCategory, 'OTHER'>;
const CATEGORY_OPTIONS: BookingCategory[] = ['TRAINING', 'MEDENSPIEL', 'CLUB_EVENT'];
const TRAINING_TYPES: TrainingType[] = [
  'MANNSCHAFTSTRAINING',
  'JUGENDTRAINING',
  'SCHNUPPERSTUNDE',
  'PRIVATGRUPPE',
];

function roundToHour(d: Date, addHours = 0): Date {
  const out = new Date(d);
  out.setMinutes(0, 0, 0);
  out.setHours(out.getHours() + addHours);
  return out;
}

function toIsoWithTimezone(d: Date): string {
  return d.toISOString();
}

function formatTime(d: Date): string {
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long' });
}

export function CreateBookingModal({ visible, onClose, initialDate }: CreateBookingModalProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { data: teams } = useTeams();
  const mutation = useCreateBooking(() => {
    onClose();
  });

  const baseDate = initialDate ?? new Date();
  const [category, setCategory] = useState<BookingCategory>('TRAINING');
  const [court, setCourt] = useState<number>(1);
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = roundToHour(baseDate);
    if (d.getHours() < HOUR_START) d.setHours(HOUR_START, 0, 0, 0);
    if (d.getHours() >= HOUR_END) d.setHours(HOUR_START, 0, 0, 0);
    return d;
  });
  const [endDate, setEndDate] = useState<Date>(() => roundToHour(baseDate, 1));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [trainingType, setTrainingType] = useState<TrainingType>('MANNSCHAFTSTRAINING');
  const [teamId, setTeamId] = useState<string | null>(null);
  const [opponentName, setOpponentName] = useState('');
  const [isHomeGame, setIsHomeGame] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const matchTeams = useMemo(
    () =>
      (teams ?? []).filter(
        (t: { type: string }) => t.type === 'MATCH_TEAM' || t.type === 'TRAINING_GROUP',
      ),
    [teams],
  );

  const reset = () => {
    setCategory('TRAINING');
    setCourt(1);
    setTitle('');
    setDescription('');
    setTeamId(null);
    setOpponentName('');
    setIsHomeGame(true);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const defaultTitle = useMemo(() => {
    if (title.trim()) return title.trim();
    if (category === 'TRAINING') {
      if (trainingType === 'MANNSCHAFTSTRAINING') {
        const team = matchTeams.find((t: { id: string }) => t.id === teamId) as
          | { shortCode: string | null; name: string }
          | undefined;
        return team ? `Training ${team.shortCode ?? team.name}` : 'Mannschaftstraining';
      }
      return TRAINING_TYPE_LABEL[trainingType];
    }
    if (category === 'MEDENSPIEL') {
      return opponentName.trim() ? `vs ${opponentName.trim()}` : 'Medenspiel';
    }
    return 'Platzbelegung';
  }, [title, category, trainingType, matchTeams, teamId, opponentName]);

  const canSubmit = useMemo(() => {
    if (endDate <= startDate) return false;
    if (category === 'TRAINING' && trainingType === 'MANNSCHAFTSTRAINING' && !teamId) return false;
    if (category === 'MEDENSPIEL' && !opponentName.trim()) return false;
    return true;
  }, [startDate, endDate, category, trainingType, teamId, opponentName]);

  const onSubmit = () => {
    const payload: CreateCourtBookingInput = {
      category,
      court,
      startDate: toIsoWithTimezone(startDate),
      endDate: toIsoWithTimezone(endDate),
      title: defaultTitle,
      description: description.trim() || undefined,
    };
    if (category === 'TRAINING') {
      payload.trainingType = trainingType;
      if (trainingType === 'MANNSCHAFTSTRAINING' && teamId) payload.teamId = teamId;
    }
    if (category === 'MEDENSPIEL') {
      payload.opponentName = opponentName.trim();
      payload.isHomeGame = isHomeGame;
      if (teamId) payload.teamId = teamId;
    }
    mutation.mutate(payload);
  };

  const applyDate = (picked: Date) => {
    const s = new Date(startDate);
    s.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
    const e = new Date(endDate);
    e.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
    setStartDate(s);
    setEndDate(e);
  };
  const applyStartTime = (picked: Date) => {
    const s = new Date(startDate);
    s.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
    setStartDate(s);
    if (endDate <= s) {
      const e = new Date(s);
      e.setHours(s.getHours() + 1);
      setEndDate(e);
    }
  };
  const applyEndTime = (picked: Date) => {
    const e = new Date(endDate);
    e.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
    setEndDate(e);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View
          style={[
            styles.header,
            { paddingHorizontal: spacing.xl, paddingTop: spacing.l, paddingBottom: spacing.m },
          ]}
        >
          <Pressable
            onPress={handleClose}
            hitSlop={8}
            accessibilityLabel="Abbrechen"
            accessibilityRole="button"
          >
            <Text style={[typography.body, { color: colors.textSecondary }]}>Abbrechen</Text>
          </Pressable>
          <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>Platz buchen</Text>
          <Pressable
            disabled={!canSubmit || mutation.isPending}
            onPress={onSubmit}
            hitSlop={8}
            accessibilityLabel="Speichern"
            accessibilityRole="button"
          >
            <Text
              style={[
                typography.bodyMedium,
                {
                  color: canSubmit && !mutation.isPending ? colors.accent : colors.textTertiary,
                  fontWeight: '700',
                },
              ]}
            >
              Speichern
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.l }}>
          {/* Kategorie */}
          <Section title="Art der Belegung" colors={colors} typography={typography}>
            <View style={styles.pillRow}>
              {CATEGORY_OPTIONS.map((c) => (
                <Pill
                  key={c}
                  label={CATEGORY_LABEL[c]}
                  active={category === c}
                  onPress={() => setCategory(c)}
                />
              ))}
            </View>
          </Section>

          {/* Platz */}
          <Section title="Platz" colors={colors} typography={typography}>
            <View style={styles.pillRow}>
              {COURTS.map((c) => (
                <Pill
                  key={c}
                  label={`Platz ${c}`}
                  active={court === c}
                  onPress={() => setCourt(c)}
                />
              ))}
            </View>
          </Section>

          {/* Datum + Zeit */}
          <Section title="Datum" colors={colors} typography={typography}>
            <FieldRow
              label={formatDate(startDate)}
              onPress={() => setShowDatePicker(true)}
              icon="calendar-outline"
            />
            {showDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(_, d) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (d) applyDate(d);
                }}
              />
            )}
          </Section>

          <Section title="Zeit" colors={colors} typography={typography}>
            <View style={{ flexDirection: 'row', gap: spacing.m }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[typography.caption, { color: colors.textSecondary, marginBottom: 4 }]}
                >
                  Von
                </Text>
                <FieldRow
                  label={formatTime(startDate)}
                  onPress={() => setShowStartPicker(true)}
                  icon="time-outline"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[typography.caption, { color: colors.textSecondary, marginBottom: 4 }]}
                >
                  Bis
                </Text>
                <FieldRow
                  label={formatTime(endDate)}
                  onPress={() => setShowEndPicker(true)}
                  icon="time-outline"
                />
              </View>
            </View>
            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="time"
                minuteInterval={15}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, d) => {
                  setShowStartPicker(Platform.OS === 'ios');
                  if (d) applyStartTime(d);
                }}
              />
            )}
            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="time"
                minuteInterval={15}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, d) => {
                  setShowEndPicker(Platform.OS === 'ios');
                  if (d) applyEndTime(d);
                }}
              />
            )}
          </Section>

          {/* Training spezifisch */}
          {category === 'TRAINING' && (
            <>
              <Section title="Trainings-Typ" colors={colors} typography={typography}>
                <View style={styles.pillRow}>
                  {TRAINING_TYPES.map((t) => (
                    <Pill
                      key={t}
                      label={TRAINING_TYPE_LABEL[t]}
                      active={trainingType === t}
                      onPress={() => setTrainingType(t)}
                    />
                  ))}
                </View>
              </Section>

              {trainingType === 'MANNSCHAFTSTRAINING' && (
                <Section title="Mannschaft" colors={colors} typography={typography}>
                  {matchTeams.length === 0 ? (
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      Keine Mannschaften verfügbar
                    </Text>
                  ) : (
                    <View style={styles.pillRow}>
                      {matchTeams.map(
                        (t: { id: string; name: string; shortCode: string | null }) => (
                          <Pill
                            key={t.id}
                            label={t.shortCode ? `${t.shortCode} · ${t.name}` : t.name}
                            active={teamId === t.id}
                            onPress={() => setTeamId(t.id)}
                          />
                        ),
                      )}
                    </View>
                  )}
                </Section>
              )}
            </>
          )}

          {/* Medenspiel spezifisch */}
          {category === 'MEDENSPIEL' && (
            <>
              <Section title="Gegner" colors={colors} typography={typography}>
                <TextInput
                  value={opponentName}
                  onChangeText={setOpponentName}
                  placeholder="z.B. TC Hennef"
                  placeholderTextColor={colors.textTertiary}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      color: colors.textPrimary,
                      borderRadius: borderRadius.md,
                    },
                  ]}
                />
              </Section>

              <Section title="Heim/Auswärts" colors={colors} typography={typography}>
                <View style={styles.pillRow}>
                  <Pill label="Heimspiel" active={isHomeGame} onPress={() => setIsHomeGame(true)} />
                  <Pill
                    label="Auswärtsspiel"
                    active={!isHomeGame}
                    onPress={() => setIsHomeGame(false)}
                  />
                </View>
              </Section>

              {matchTeams.length > 0 && (
                <Section
                  title="Eigene Mannschaft (optional)"
                  colors={colors}
                  typography={typography}
                >
                  <View style={styles.pillRow}>
                    <Pill
                      label="Keine Angabe"
                      active={teamId === null}
                      onPress={() => setTeamId(null)}
                    />
                    {matchTeams.map((t: { id: string; name: string; shortCode: string | null }) => (
                      <Pill
                        key={t.id}
                        label={t.shortCode ? `${t.shortCode}` : t.name}
                        active={teamId === t.id}
                        onPress={() => setTeamId(t.id)}
                      />
                    ))}
                  </View>
                </Section>
              )}
            </>
          )}

          {/* Titel (optional, wird sonst generiert) */}
          <Section title="Titel (optional)" colors={colors} typography={typography}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={defaultTitle}
              placeholderTextColor={colors.textTertiary}
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.textPrimary,
                  borderRadius: borderRadius.md,
                },
              ]}
            />
          </Section>

          {/* Notiz */}
          <Section title="Notiz (optional)" colors={colors} typography={typography}>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="z.B. Rasen gesprengt, Zeit verschoben"
              placeholderTextColor={colors.textTertiary}
              multiline
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.textPrimary,
                  borderRadius: borderRadius.md,
                  minHeight: 80,
                  textAlignVertical: 'top',
                  paddingTop: 12,
                },
              ]}
            />
          </Section>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Section({
  title,
  children,
  colors,
  typography,
}: {
  title: string;
  children: React.ReactNode;
  colors: { textSecondary: string };
  typography: { captionMedium: object };
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={[typography.captionMedium, { color: colors.textSecondary }]}>{title}</Text>
      {children}
    </View>
  );
}

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors, typography } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={{
        backgroundColor: active ? colors.buttonPrimary : colors.backgroundSecondary,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 999,
      }}
    >
      <Text
        style={[
          typography.caption,
          {
            color: active ? colors.buttonPrimaryText : colors.textPrimary,
            fontWeight: active ? '700' : '500',
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FieldRow({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  const { colors, typography, borderRadius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundSecondary,
        borderRadius: borderRadius.md,
        paddingHorizontal: 14,
        height: 48,
      }}
    >
      <Ionicons name={icon} size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
      <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>{label}</Text>
      <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  input: {
    height: 48,
    paddingHorizontal: 14,
  },
});
