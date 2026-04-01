import api from '../../../lib/api';

export const todoService = {
  getTodos: (scope?: string, teamId?: string) => {
    const params = new URLSearchParams();
    if (scope) params.set('scope', scope);
    if (teamId) params.set('teamId', teamId);
    return api.get(`/todos?${params.toString()}`).then(r => r.data.data);
  },

  createTodo: (input: any) =>
    api.post('/todos', input).then(r => r.data.data),

  updateTodo: (todoId: string, input: any) =>
    api.put(`/todos/${todoId}`, input).then(r => r.data),

  deleteTodo: (todoId: string) =>
    api.delete(`/todos/${todoId}`).then(r => r.data),
};
