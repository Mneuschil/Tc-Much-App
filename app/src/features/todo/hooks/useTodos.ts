import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { todoService } from '../services/todoService';
import { getErrorMessage } from '../../../utils/errorUtils';
import { useToast } from '../../../components/ui/Toast';
import type { CreateTodoInput, UpdateTodoInput } from '@tennis-club/shared';

export function useTodos(scope?: string, teamId?: string) {
  return useQuery({
    queryKey: ['todos', scope, teamId],
    queryFn: () => todoService.getTodos(scope, teamId),
  });
}

export function useCreateTodo() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (input: CreateTodoInput) => todoService.createTodo(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      showToast('Aufgabe erstellt');
    },
    onError: (err: Error) =>
      showToast(getErrorMessage(err, 'Todo konnte nicht erstellt werden'), 'error'),
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: ({ todoId, input }: { todoId: string; input: UpdateTodoInput }) =>
      todoService.updateTodo(todoId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      showToast('Aufgabe aktualisiert');
    },
    onError: (err: Error) =>
      showToast(getErrorMessage(err, 'Todo konnte nicht aktualisiert werden'), 'error'),
  });
}

export function useToggleTodoStatus() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: ({ todoId, status }: { todoId: string; status: 'OPEN' | 'DONE' }) =>
      todoService.toggleStatus(todoId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
    onError: (err: Error) =>
      showToast(getErrorMessage(err, 'Status konnte nicht geändert werden'), 'error'),
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (todoId: string) => todoService.deleteTodo(todoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      showToast('Aufgabe gelöscht');
    },
    onError: () => showToast('Todo konnte nicht gelöscht werden', 'error'),
  });
}
