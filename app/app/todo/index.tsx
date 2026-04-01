import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, Modal, TextInput, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { Avatar, Badge, EmptyState } from '../../src/components/ui';
import { usePermissions } from '../../src/hooks/usePermissions';
import { useTodos, useUpdateTodo, useCreateTodo } from '../../src/features/todo/hooks/useTodos';
import { useClubMembers } from '../../src/hooks/useProfile';
import { formatDate } from '../../src/utils/formatDate';
import { MOCK_TODOS } from '../../src/lib/mockData';
import type { CreateTodoInput } from '@tennis-club/shared';

interface TodoItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scope: string;
  dueDate: string | null;
  assignee: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  team: { id: string; name: string } | null;
}

interface MemberItem {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export default function TodoScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { canCreateTodo } = usePermissions();
  const { data, isLoading, refetch } = useTodos();
  const updateTodo = useUpdateTodo();
  const [showCreate, setShowCreate] = useState(false);

  const apiTodos = ((data ?? []) as TodoItem[]);
  const todos = apiTodos.length > 0 ? apiTodos : (MOCK_TODOS as TodoItem[]);

  const renderTodo = ({ item }: { item: TodoItem }) => {
    const isDone = item.status === 'DONE';
    return (
      <Pressable onPress={() => updateTodo.mutate({ todoId: item.id, input: { status: isDone ? 'OPEN' : 'DONE' } })}
        style={[styles.todoCard, {
          backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.xl,
          padding: spacing.lg, marginBottom: spacing.sm, opacity: isDone ? 0.5 : 1,
        }]}>
        <Ionicons name={isDone ? 'checkbox' : 'square-outline'} size={22} color={isDone ? colors.success : colors.textTertiary} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={[typography.bodyMedium, { color: colors.textPrimary, textDecorationLine: isDone ? 'line-through' : 'none' }]}>{item.title}</Text>
          {item.description && <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>{item.description}</Text>}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: spacing.sm, flexWrap: 'wrap' }}>
            <Badge label={item.scope} variant="neutral" />
            {item.team && <Badge label={item.team.name} variant="mint" />}
          </View>
          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 4 }]}>
            {item.assignee.firstName} {item.assignee.lastName}
            {item.dueDate && ` · Faellig: ${formatDate(item.dueDate)}`}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <>
      <Stack.Screen options={{
        headerShown: true,
        title: 'Todos',
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
        headerRight: canCreateTodo ? () => (
          <Pressable onPress={() => setShowCreate(true)} hitSlop={12}>
            <Ionicons name="add" size={28} color={colors.textPrimary} />
          </Pressable>
        ) : undefined,
      }} />
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
        <FlatList data={todos} keyExtractor={(item) => item.id} renderItem={renderTodo}
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
          ListEmptyComponent={!isLoading ? <EmptyState title="Keine Todos" description="Alles erledigt" /> : null}
        />
      </SafeAreaView>

      <CreateTodoModal visible={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}

/* ─── CreateTodoModal ─────────────────────────────────────────────── */

interface CreateTodoModalProps {
  visible: boolean;
  onClose: () => void;
}

function CreateTodoModal({ visible, onClose }: CreateTodoModalProps) {
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

  const selectedMember = members.find(m => m.id === assigneeId);

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
    <Modal visible={visible} presentationStyle="pageSheet" animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.xl }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>Neues Todo</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: 0 }}>
          <Text style={[typography.captionMedium, { color: colors.textSecondary, marginBottom: spacing.xs }]}>Titel</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.md, color: colors.textPrimary }]}
            value={title} onChangeText={setTitle} placeholder="Titel eingeben" placeholderTextColor={colors.textTertiary}
          />

          <Text style={[typography.captionMedium, { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.xs }]}>Beschreibung</Text>
          <TextInput
            style={[styles.input, styles.multiline, { backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.md, color: colors.textPrimary }]}
            value={description} onChangeText={setDescription} placeholder="Beschreibung (optional)" placeholderTextColor={colors.textTertiary}
            multiline numberOfLines={3} textAlignVertical="top"
          />

          <Text style={[typography.captionMedium, { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.xs }]}>Bereich</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {(['BOARD', 'TRAINERS', 'TEAM'] as const).map(s => (
              <Pressable key={s} onPress={() => setScope(s)}
                style={[styles.scopePill, { backgroundColor: scope === s ? colors.chipActive : colors.backgroundSecondary, borderRadius: borderRadius.full }]}>
                <Text style={[typography.caption, { color: scope === s ? colors.textInverse : colors.textPrimary, fontWeight: '600' }]}>{s}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[typography.captionMedium, { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.xs }]}>Zugewiesen an</Text>
          <Pressable onPress={() => setShowPicker(true)}
            style={[styles.input, { backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.md, flexDirection: 'row', alignItems: 'center' }]}>
            {selectedMember ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Avatar firstName={selectedMember.firstName} lastName={selectedMember.lastName} size="xs" />
                <Text style={[typography.body, { color: colors.textPrimary, marginLeft: spacing.sm }]}>
                  {selectedMember.firstName} {selectedMember.lastName}
                </Text>
              </View>
            ) : (
              <Text style={[typography.body, { color: colors.textTertiary }]}>Mitglied auswaehlen</Text>
            )}
            <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
          </Pressable>

          {showPicker && (
            <View style={{ backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.md, marginTop: spacing.xs, maxHeight: 200 }}>
              <ScrollView>
                {members.map(m => (
                  <Pressable key={m.id} onPress={() => { setAssigneeId(m.id); setShowPicker(false); }}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: assigneeId === m.id ? colors.accentSubtle : 'transparent' }}>
                    <Avatar firstName={m.firstName} lastName={m.lastName} imageUrl={m.avatarUrl} size="xs" />
                    <Text style={[typography.bodySmall, { color: colors.textPrimary, marginLeft: spacing.sm }]}>{m.firstName} {m.lastName}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={[typography.captionMedium, { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.xs }]}>Faellig am (optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.md, color: colors.textPrimary }]}
            value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textTertiary}
          />

          <Pressable
            onPress={handleCreate}
            disabled={!title.trim() || !assigneeId || createTodo.isPending}
            style={[styles.createBtn, {
              backgroundColor: title.trim() && assigneeId ? colors.accent : colors.surface,
              borderRadius: borderRadius.md,
              marginTop: spacing.xxl,
            }]}
          >
            <Text style={[typography.buttonSmall, { color: title.trim() && assigneeId ? colors.textInverse : colors.textTertiary }]}>
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
  todoCard: { flexDirection: 'row', alignItems: 'flex-start' },
  input: { height: 48, paddingHorizontal: 16, fontSize: 15, justifyContent: 'center' },
  multiline: { height: 100, paddingTop: 12, paddingBottom: 12 },
  scopePill: { paddingHorizontal: 14, paddingVertical: 8 },
  createBtn: { height: 48, alignItems: 'center', justifyContent: 'center' },
});
