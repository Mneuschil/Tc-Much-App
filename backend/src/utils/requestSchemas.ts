import { z } from 'zod';

// ─── Helper: optional integer from query string ─────────────────
// undefined / "" → default, "abc" → ZodError (400), "5" → 5
function optionalInt(defaultValue: number, { min = 1, max }: { min?: number; max?: number } = {}) {
  let schema = z.coerce.number().int().min(min);
  if (max !== undefined) schema = schema.max(max);
  return z.preprocess(
    (val) => (val === undefined || val === '' ? undefined : val),
    schema.optional().default(defaultValue),
  );
}

// ─── Param Schemas ──────────────────────────────────────────────
export const channelIdParams = z.object({ channelId: z.string().min(1) });
export const messageIdParams = z.object({ messageId: z.string().min(1) });
export const messageReactionParams = z.object({
  messageId: z.string().min(1),
  type: z.string().min(1),
});
export const userIdParams = z.object({ userId: z.string().min(1) });
export const teamIdParams = z.object({ teamId: z.string().min(1) });
export const teamMemberParams = z.object({
  teamId: z.string().min(1),
  userId: z.string().min(1),
});
export const eventIdParams = z.object({ eventId: z.string().min(1) });
export const matchIdParams = z.object({ matchId: z.string().min(1) });
export const tournamentIdParams = z.object({ tournamentId: z.string().min(1) });
export const notificationIdParams = z.object({ notificationId: z.string().min(1) });
export const clubIdParams = z.object({ clubId: z.string().min(1) });
export const fileIdParams = z.object({ fileId: z.string().min(1) });
export const formIdParams = z.object({ formId: z.string().min(1) });
export const todoIdParams = z.object({ todoId: z.string().min(1) });
export const tokenParams = z.object({ token: z.string().min(1) });
export const idParams = z.object({ id: z.string().min(1) });
export const challengeIdParams = z.object({ challengeId: z.string().min(1) });

// ─── Query Schemas ──────────────────────────────────────────────
export const paginationQuery = z.object({
  page: optionalInt(1, { min: 1 }),
  limit: optionalInt(20, { min: 1, max: 100 }),
});

export const channelListQuery = z.object({
  page: optionalInt(1, { min: 1 }),
  limit: optionalInt(50, { min: 1, max: 100 }),
});

export const messageListQuery = z.object({
  cursor: z.string().optional(),
  limit: optionalInt(20, { min: 1, max: 100 }),
  search: z.string().optional(),
});

export const notificationListQuery = z.object({
  unread: z.enum(['true', 'false']).optional(),
  page: optionalInt(1, { min: 1 }),
  limit: optionalInt(30, { min: 1, max: 100 }),
});

export const eventListQuery = z.object({
  type: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  teamId: z.string().optional(),
  page: optionalInt(1, { min: 1 }),
  limit: optionalInt(20, { min: 1, max: 100 }),
});

export const userListQuery = z.object({
  role: z.string().optional(),
  page: optionalInt(1, { min: 1 }),
  limit: optionalInt(50, { min: 1, max: 100 }),
});
