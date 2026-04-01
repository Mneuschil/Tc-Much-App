import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { Badge, EmptyState } from '../../src/components/ui';
import { useTodos, useUpdateTodo } from '../../src/features/todo/hooks/useTodos';
import { formatDate } from '../../src/utils/formatDate';
import { MOCK_TODOS } from '../../src/lib/mockData';

export default function TodoScreen() {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const { data, isLoading, refetch } = useTodos();
  const updateTodo = useUpdateTodo();

  const apiTodos = ((data ?? []) as any[]);
  const todos = apiTodos.length > 0 ? apiTodos : MOCK_TODOS;

  const renderTodo = ({ item }: { item: any }) => {
    const isDone = item.status === 'DONE';
    return (
      <Pressable onPress={() => updateTodo.mutate({ todoId: item.id, input: { status: isDone ? 'OPEN' : 'DONE' } })}
        style={[styles.todoCard, {
          backgroundColor: colors.cardBackground, borderRadius: borderRadius.xl,
          padding: spacing.lg, marginBottom: spacing.sm, opacity: isDone ? 0.5 : 1, ...shadows.sm,
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
      <Stack.Screen options={{ headerShown: true, title: 'Todos', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.textPrimary, headerShadowVisible: false }} />
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
        <FlatList data={todos} keyExtractor={(item) => item.id} renderItem={renderTodo}
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
          ListEmptyComponent={!isLoading ? <EmptyState title="Keine Todos" description="Alles erledigt" /> : null}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  todoCard: { flexDirection: 'row', alignItems: 'flex-start' },
});
