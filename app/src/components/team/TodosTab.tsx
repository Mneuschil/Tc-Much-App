import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Avatar, EmptyState } from '../ui';
import { useTodos, useToggleTodoStatus, useDeleteTodo } from '../../features/todo/hooks/useTodos';
import { usePermissions } from '../../hooks/usePermissions';
import { formatDate } from '../../utils/formatDate';
import { CreateTodoModal } from '../todo/CreateTodoModal';

interface TodoData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  assignee: { id: string; firstName: string; lastName: string; avatarUrl: string | null } | null;
}

interface TodosTabProps {
  teamId: string;
}

export function TodosTab({ teamId }: TodosTabProps) {
  const { colors, typography, spacing, radii } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: todos, isLoading, refetch } = useTodos(undefined, teamId);
  const { canCreateTodo } = usePermissions();
  const [createOpen, setCreateOpen] = useState(false);
  const toggleStatus = useToggleTodoStatus();
  const deleteTodo = useDeleteTodo();

  const todoList = (todos ?? []) as TodoData[];

  const handleToggle = (todo: TodoData) => {
    const newStatus = todo.status === 'DONE' ? 'OPEN' : 'DONE';
    toggleStatus.mutate({ todoId: todo.id, status: newStatus });
  };

  const handleDelete = (todo: TodoData) => {
    Alert.alert('Aufgabe löschen', `"${todo.title}" wirklich löschen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => deleteTodo.mutate(todo.id) },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={todoList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <EmptyState title="Keine Aufgaben" description="Keine offenen Aufgaben für dieses Team" />
        }
        renderItem={({ item }) => {
          const isDone = item.status === 'DONE';
          return (
            <Pressable
              onLongPress={() => handleDelete(item)}
              style={[
                styles.todoCard,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: radii.lg,
                  padding: spacing.lg,
                  marginBottom: spacing.md,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Pressable onPress={() => handleToggle(item)} hitSlop={8}>
                  <Ionicons
                    name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={isDone ? colors.success : colors.textTertiary}
                  />
                </Pressable>
                <Text
                  style={[
                    typography.bodyMedium,
                    {
                      color: isDone ? colors.textTertiary : colors.textPrimary,
                      flex: 1,
                      marginLeft: spacing.sm,
                      textDecorationLine: isDone ? 'line-through' : 'none',
                    },
                  ]}
                >
                  {item.title}
                </Text>
              </View>
              {item.dueDate && (
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textSecondary, marginTop: spacing.xs, marginLeft: 30 },
                  ]}
                >
                  Fällig: {formatDate(item.dueDate)}
                </Text>
              )}
              {item.assignee && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: spacing.xs,
                    marginLeft: 30,
                  }}
                >
                  <Avatar
                    firstName={item.assignee.firstName}
                    lastName={item.assignee.lastName}
                    size="xs"
                  />
                  <Text
                    style={[typography.caption, { color: colors.textSecondary, marginLeft: 4 }]}
                  >
                    {item.assignee.firstName} {item.assignee.lastName}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        }}
      />

      {canCreateTodo && (
        <Pressable
          onPress={() => setCreateOpen(true)}
          style={({ pressed }) => [
            styles.fab,
            {
              bottom: Math.max(20 - insets.bottom, 4),
              backgroundColor: colors.accent,
              borderRadius: radii.pill,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons name="add" size={28} color={colors.textInverse} />
        </Pressable>
      )}

      <CreateTodoModal visible={createOpen} onClose={() => setCreateOpen(false)} teamId={teamId} />
    </View>
  );
}

const styles = StyleSheet.create({
  todoCard: { overflow: 'hidden' },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
