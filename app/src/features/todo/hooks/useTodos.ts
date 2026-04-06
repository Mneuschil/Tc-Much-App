import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { AxiosError } from 'axios';
import { todoService } from '../services/todoService';
import type { CreateTodoInput, UpdateTodoInput } from '@tennis-club/shared';

interface ApiErrorResponse {
  error?: { message?: string };
}

function getErrorMessage(err: Error, fallback: string): string {
  const axiosErr = err as AxiosError<ApiErrorResponse>;
  return axiosErr.response?.data?.error?.message ?? fallback;
}

export function useTodos(scope?: string, teamId?: string) {
  return useQuery({
    queryKey: ['todos', scope, teamId],
    queryFn: () => todoService.getTodos(scope, teamId),
  });
}

export function useCreateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTodoInput) => todoService.createTodo(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
    onError: (err: Error) =>
      Alert.alert('Fehler', getErrorMessage(err, 'Todo konnte nicht erstellt werden')),
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ todoId, input }: { todoId: string; input: UpdateTodoInput }) =>
      todoService.updateTodo(todoId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
    onError: (err: Error) =>
      Alert.alert('Fehler', getErrorMessage(err, 'Todo konnte nicht aktualisiert werden')),
  });
}

export function useToggleTodoStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ todoId, status }: { todoId: string; status: 'OPEN' | 'DONE' }) =>
      todoService.toggleStatus(todoId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
    onError: (err: Error) =>
      Alert.alert('Fehler', getErrorMessage(err, 'Status konnte nicht geaendert werden')),
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
