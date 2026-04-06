import api from '../../../lib/api';
import { ENDPOINTS } from '../../../lib/endpoints';
import type { CreateTodoInput, UpdateTodoInput } from '@tennis-club/shared';

export const todoService = {
  getTodos: (scope?: string, teamId?: string) => {
    const params = new URLSearchParams();
    if (scope) params.set('scope', scope);
    if (teamId) params.set('teamId', teamId);
    return api.get(`${ENDPOINTS.todos.list}?${params.toString()}`).then((r) => r.data.data);
  },

  createTodo: (input: CreateTodoInput) =>
    api.post(ENDPOINTS.todos.create, input).then((r) => r.data.data),

  updateTodo: (todoId: string, input: UpdateTodoInput) =>
    api.put(ENDPOINTS.todos.update(todoId), input).then((r) => r.data.data),

  toggleStatus: (todoId: string, status: 'OPEN' | 'DONE') =>
    api.patch(ENDPOINTS.todos.toggleStatus(todoId), { status }).then((r) => r.data.data),

  deleteTodo: (todoId: string) => api.delete(ENDPOINTS.todos.delete(todoId)).then((r) => r.data),
};
