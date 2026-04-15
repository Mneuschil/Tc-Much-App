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
import { Avatar } from '../ui';
import { useTodoForm, formatDisplayDate } from '../../features/todo/hooks/useTodoForm';

interface CreateTodoModalProps {
  visible: boolean;
  onClose: () => void;
  teamId?: string;
}

export function CreateTodoModal({ visible, onClose, teamId }: CreateTodoModalProps) {
  const { colors, typography, spacing, borderRadius, isDark } = useTheme();
  const form = useTodoForm({ teamId, onSuccess: onClose });

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
            Neues Todo
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
            nativeID="todo-title-label"
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
            accessibilityLabelledBy="todo-title-label"
          />

          {/* Beschreibung */}
          <Text
            nativeID="todo-desc-label"
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
            accessibilityLabelledBy="todo-desc-label"
          />

          {/* Bereich */}
          <Text
            style={[
              typography.captionMedium,
              { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.xs },
            ]}
          >
            Bereich
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {(['BOARD', 'TRAINERS', 'TEAM'] as const).map((s) => (
              <Pressable
                key={s}
                onPress={() => form.setScope(s)}
                accessibilityLabel={s}
                accessibilityRole="button"
                accessibilityState={{ selected: form.scope === s }}
                style={[
                  styles.scopePill,
                  {
                    backgroundColor:
                      form.scope === s ? colors.chipActive : colors.backgroundSecondary,
                    borderRadius: borderRadius.full,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: form.scope === s ? colors.textInverse : colors.textPrimary,
                      fontWeight: '600',
                    },
                  ]}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Zugewiesen an */}
          <Text
            style={[
              typography.captionMedium,
              { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.xs },
            ]}
          >
            Zugewiesen an
          </Text>
          <Pressable
            onPress={() => form.setShowMemberPicker(true)}
            accessibilityLabel={
              form.selectedMember
                ? `Zugewiesen an: ${form.selectedMember.firstName} ${form.selectedMember.lastName}`
                : 'Mitglied auswählen'
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
            {form.selectedMember ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Avatar
                  firstName={form.selectedMember.firstName}
                  lastName={form.selectedMember.lastName}
                  size="xs"
                />
                <Text
                  style={[typography.body, { color: colors.textPrimary, marginLeft: spacing.sm }]}
                >
                  {form.selectedMember.firstName} {form.selectedMember.lastName}
                </Text>
              </View>
            ) : (
              <Text style={[typography.body, { color: colors.textTertiary }]}>
                Mitglied auswählen
              </Text>
            )}
            <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
          </Pressable>
          {form.showMemberPicker && (
            <View
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: borderRadius.md,
                marginTop: spacing.xs,
                maxHeight: 200,
              }}
            >
              <ScrollView>
                {form.members.map((m) => (
                  <Pressable
                    key={m.id}
                    onPress={() => {
                      form.setAssigneeId(m.id);
                      form.setShowMemberPicker(false);
                    }}
                    accessibilityLabel={`${m.firstName} ${m.lastName} zuweisen`}
                    accessibilityRole="button"
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: spacing.md,
                      backgroundColor:
                        form.assigneeId === m.id ? colors.accentSubtle : 'transparent',
                    }}
                  >
                    <Avatar
                      firstName={m.firstName}
                      lastName={m.lastName}
                      imageUrl={m.avatarUrl}
                      size="xs"
                    />
                    <Text
                      style={[
                        typography.bodySmall,
                        { color: colors.textPrimary, marginLeft: spacing.sm },
                      ]}
                    >
                      {m.firstName} {m.lastName}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Faelligkeitsdatum */}
          <Text
            style={[
              typography.captionMedium,
              { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.xs },
            ]}
          >
            Fällig am (optional)
          </Text>
          <Pressable
            onPress={() => form.setShowDatePicker(true)}
            accessibilityLabel={
              form.dueDate
                ? `Fällig am: ${formatDisplayDate(form.dueDate)}`
                : 'Fälligkeitsdatum auswählen'
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
              name="calendar-outline"
              size={18}
              color={form.dueDate ? colors.textPrimary : colors.textTertiary}
              style={{ marginRight: spacing.sm }}
            />
            <Text
              style={[
                typography.body,
                { color: form.dueDate ? colors.textPrimary : colors.textTertiary, flex: 1 },
              ]}
            >
              {form.dueDate ? formatDisplayDate(form.dueDate) : 'Datum auswählen'}
            </Text>
            {form.dueDate && (
              <Pressable
                onPress={() => form.setDueDate(null)}
                hitSlop={12}
                accessibilityLabel="Fälligkeitsdatum entfernen"
                accessibilityRole="button"
              >
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </Pressable>
            )}
          </Pressable>
          {form.showDatePicker && (
            <View
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: borderRadius.md,
                marginTop: spacing.xs,
                overflow: 'hidden',
              }}
            >
              <DateTimePicker
                value={form.dueDate ?? new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                minimumDate={new Date()}
                locale="de-DE"
                themeVariant={isDark ? 'dark' : 'light'}
                accentColor={colors.accent}
                onChange={form.handleDateChange}
              />
              {Platform.OS === 'ios' && (
                <Pressable
                  onPress={() => form.setShowDatePicker(false)}
                  accessibilityLabel="Datum bestätigen"
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

          {/* Erstellen Button */}
          <Pressable
            onPress={form.handleCreate}
            disabled={!form.canSubmit}
            accessibilityLabel="Aufgabe erstellen"
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
              Erstellen
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
  scopePill: { paddingHorizontal: 14, paddingVertical: 8 },
  actionBtn: { height: 48, alignItems: 'center', justifyContent: 'center' },
});
