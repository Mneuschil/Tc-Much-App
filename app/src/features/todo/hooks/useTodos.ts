import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { todoService } from '../services/todoService';

export function useTodos(scope?: string, teamId?: string) {
  return useQuery({
    queryKey: ['todos', scope, teamId],
    queryFn: () => todoService.getTodos(scope, teamId),
  });
}

export function useCreateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => todoService.createTodo(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
    onError: (err: any) => Alert.alert('Fehler', err?.response?.data?.error?.message ?? 'Todo konnte nicht erstellt werden'),
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ todoId, input }: { todoId: string; input: any }) =>
      todoService.updateTodo(todoId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
    onError: (err: any) => Alert.alert('Fehler', err?.response?.data?.error?.message ?? 'Todo konnte nicht aktualisiert werden'),
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (todoId: string) => todoService.deleteTodo(todoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
    onError: () => Alert.alert('Fehler', 'Todo konnte nicht geloescht werden'),
  });
}
