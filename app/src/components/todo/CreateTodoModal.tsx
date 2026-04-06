import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Avatar } from '../ui';
import { useCreateTodo } from '../../features/todo/hooks/useTodos';
import { useClubMembers } from '../../hooks/useProfile';
import type { CreateTodoInput } from '@tennis-club/shared';

interface MemberItem {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

interface CreateTodoModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateTodoModal({ visible, onClose }: CreateTodoModalProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const createTodo = useCreateTodo();
  const { data: membersData } = useClubMembers();
  const members = (membersData ?? []) as MemberItem[];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [scope, setScope] = useState<'BOARD' | 'TRAINERS' | 'TEAM'>('BOARD');
  const [showPicker, setShowPicker] = useState(false);

  const selectedMember = members.find((m) => m.id === assigneeId);

  const handleCreate = () => {
    if (!title.trim() || !assigneeId) return;
    const input: CreateTodoInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      assigneeId,
      scope,
      dueDate: dueDate.trim() || undefined,
    };
    createTodo.mutate(input, {
      onSuccess: () => {
        setTitle('');
        setDescription('');
        setAssigneeId('');
        setDueDate('');
        onClose();
      },
    });
  };

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
          <Text style={[typography.h2, { color: colors.textPrimary }]}>Neues Todo</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: 0 }}>
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
          />

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
          />

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
                onPress={() => setScope(s)}
                style={[
                  styles.scopePill,
                  {
                    backgroundColor: scope === s ? colors.chipActive : colors.backgroundSecondary,
                    borderRadius: borderRadius.full,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: scope === s ? colors.textInverse : colors.textPrimary,
                      fontWeight: '600',
                    },
                  ]}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text
            style={[
              typography.captionMedium,
              { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.xs },
            ]}
          >
            Zugewiesen an
          </Text>
          <Pressable
            onPress={() => setShowPicker(true)}
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
            {selectedMember ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Avatar
                  firstName={selectedMember.firstName}
                  lastName={selectedMember.lastName}
                  size="xs"
                />
                <Text
                  style={[typography.body, { color: colors.textPrimary, marginLeft: spacing.sm }]}
                >
                  {selectedMember.firstName} {selectedMember.lastName}
                </Text>
              </View>
            ) : (
              <Text style={[typography.body, { color: colors.textTertiary }]}>
                Mitglied auswaehlen
              </Text>
            )}
            <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
          </Pressable>

          {showPicker && (
            <View
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: borderRadius.md,
                marginTop: spacing.xs,
                maxHeight: 200,
              }}
            >
              <ScrollView>
                {members.map((m) => (
                  <Pressable
                    key={m.id}
                    onPress={() => {
                      setAssigneeId(m.id);
                      setShowPicker(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: spacing.md,
                      backgroundColor: assigneeId === m.id ? colors.accentSubtle : 'transparent',
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

          <Text
            style={[
              typography.captionMedium,
              { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.xs },
            ]}
          >
            Faellig am (optional)
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
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textTertiary}
          />

          <Pressable
            onPress={handleCreate}
            disabled={!title.trim() || !assigneeId || createTodo.isPending}
            style={[
              styles.createBtn,
              {
                backgroundColor: title.trim() && assigneeId ? colors.accent : colors.surface,
                borderRadius: borderRadius.md,
                marginTop: spacing.xxl,
              },
            ]}
          >
            <Text
              style={[
                typography.buttonSmall,
                { color: title.trim() && assigneeId ? colors.textInverse : colors.textTertiary },
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
  input: { height: 48, paddingHorizontal: 16, fontSize: 15, justifyContent: 'center' },
  multiline: { height: 100, paddingTop: 12, paddingBottom: 12 },
  scopePill: { paddingHorizontal: 14, paddingVertical: 8 },
  createBtn: { height: 48, alignItems: 'center', justifyContent: 'center' },
});
