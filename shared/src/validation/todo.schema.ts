import { z } from 'zod';

export const createTodoSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').max(200),
  description: z.string().max(2000).optional(),
  assigneeId: z.string().uuid(),
  dueDate: z.string().datetime().optional(),
  scope: z.enum(['BOARD', 'TRAINERS', 'TEAM']),
  teamId: z.string().uuid().optional(),
});

export const updateTodoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  assigneeId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  status: z.enum(['OPEN', 'DONE']).optional(),
});

export const toggleTodoStatusSchema = z.object({
  status: z.enum(['OPEN', 'DONE']),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
export type ToggleTodoStatusInput = z.infer<typeof toggleTodoStatusSchema>;
