import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Avatar, Button, EmptyState } from '../ui';
import { useTodos } from '../../features/todo/hooks/useTodos';
import { usePermissions } from '../../hooks/usePermissions';
import { formatDate } from '../../utils/formatDate';

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
  const router = useRouter();
  const { data: todos } = useTodos(undefined, teamId);
  const { isTeamCaptain, isBoard } = usePermissions();
  const canCreate = isTeamCaptain || isBoard;

  const todoList = (todos ?? []) as TodoData[];

  return (
    <FlatList
      data={todoList}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}
      ListEmptyComponent={
        <EmptyState title="Keine Aufgaben" description="Keine offenen Aufgaben fuer dieses Team" />
      }
      ListFooterComponent={
        canCreate ? (
          <View style={{ marginTop: spacing.lg }}>
            <Button
              title="Aufgabe erstellen"
              onPress={() => router.push('/todo' as never)}
              variant="secondary"
            />
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <View
          style={[
            styles.todoCard,
            {
              backgroundColor: colors.backgroundSecondary,
              borderRadius: radii.lg,
              padding: spacing.l,
              marginBottom: spacing.md,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name={item.status === 'DONE' ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={item.status === 'DONE' ? colors.success : colors.textTertiary}
            />
            <Text
              style={[
                typography.bodyMedium,
                { color: colors.textPrimary, flex: 1, marginLeft: spacing.sm },
              ]}
            >
              {item.title}
            </Text>
          </View>
          {item.dueDate && (
            <Text
              style={[
                typography.caption,
                { color: colors.textSecondary, marginTop: spacing.xs, marginLeft: 28 },
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
                marginLeft: 28,
              }}
            >
              <Avatar
                firstName={item.assignee.firstName}
                lastName={item.assignee.lastName}
                size="xs"
              />
              <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 4 }]}>
                {item.assignee.firstName} {item.assignee.lastName}
              </Text>
            </View>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  todoCard: { overflow: 'hidden' },
});
