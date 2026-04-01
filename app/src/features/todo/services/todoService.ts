import api from '../../../lib/api';
import type { CreateTodoInput, UpdateTodoInput } from '@tennis-club/shared';

export const todoService = {
  getTodos: (scope?: string, teamId?: string) => {
    const params = new URLSearchParams();
    if (scope) params.set('scope', scope);
    if (teamId) params.set('teamId', teamId);
    return api.get(`/todos?${params.toString()}`).then(r => r.data.data);
  },

  createTodo: (input: CreateTodoInput) =>
    api.post('/todos', input).then(r => r.data.data),

  updateTodo: (todoId: string, input: UpdateTodoInput) =>
    api.put(`/todos/${todoId}`, input).then(r => r.data),

  deleteTodo: (todoId: string) =>
    api.delete(`/todos/${todoId}`).then(r => r.data),
};
