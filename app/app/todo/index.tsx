import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { Badge, EmptyState, QueryError } from '../../src/components/ui';
import { usePermissions } from '../../src/hooks/usePermissions';
import { useTodos, useToggleTodoStatus } from '../../src/features/todo/hooks/useTodos';
import { formatDate } from '../../src/utils/formatDate';
import { CreateTodoModal } from '../../src/components/todo/CreateTodoModal';

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

export default function TodoScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { canCreateTodo } = usePermissions();
  const { data, isLoading, isError, refetch } = useTodos();
  const toggleStatus = useToggleTodoStatus();
  const [showCreate, setShowCreate] = useState(false);

  const todos = (data ?? []) as TodoItem[];

  const renderTodo = ({ item }: { item: TodoItem }) => {
    const isDone = item.status === 'DONE';
    return (
      <Pressable
        onPress={() => toggleStatus.mutate({ todoId: item.id, status: isDone ? 'OPEN' : 'DONE' })}
        style={[
          styles.todoCard,
          {
            backgroundColor: colors.backgroundSecondary,
            borderRadius: borderRadius.xl,
            padding: spacing.lg,
            marginBottom: spacing.sm,
            opacity: isDone ? 0.5 : 1,
          },
        ]}
      >
        <Ionicons
          name={isDone ? 'checkbox' : 'square-outline'}
          size={22}
          color={isDone ? colors.success : colors.textTertiary}
        />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text
            style={[
              typography.bodyMedium,
              { color: colors.textPrimary, textDecorationLine: isDone ? 'line-through' : 'none' },
            ]}
          >
            {item.title}
          </Text>
          {item.description && (
            <Text
              style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}
              numberOfLines={1}
            >
              {item.description}
            </Text>
          )}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: spacing.sm, flexWrap: 'wrap' }}>
            <Badge label={item.scope} variant="neutral" />
            {item.team && <Badge label={item.team.name} variant="mint" />}
          </View>
          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 4 }]}>
            {item.assignee?.firstName ?? 'Nicht zugewiesen'} {item.assignee?.lastName ?? ''}
            {item.dueDate && ` · Faellig: ${formatDate(item.dueDate)}`}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Todos',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
          headerRight: canCreateTodo
            ? () => (
                <Pressable onPress={() => setShowCreate(true)} hitSlop={12}>
                  <Ionicons name="add" size={28} color={colors.textPrimary} />
                </Pressable>
              )
            : undefined,
        }}
      />
      <SafeAreaView
        edges={['bottom']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <FlatList
          data={todos}
          keyExtractor={(item) => item.id}
          renderItem={renderTodo}
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            !isLoading ? (
              isError ? (
                <QueryError onRetry={refetch} />
              ) : (
                <EmptyState title="Keine Todos" description="Alles erledigt" />
              )
            ) : null
          }
        />
      </SafeAreaView>

      <CreateTodoModal visible={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  todoCard: { flexDirection: 'row', alignItems: 'flex-start' },
});
