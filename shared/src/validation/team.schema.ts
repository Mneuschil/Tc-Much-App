import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z.string().min(1, 'Mannschaftsname ist erforderlich').max(100),
  type: z.enum(['MATCH_TEAM', 'TRAINING_GROUP', 'BOARD_GROUP']),
  league: z.string().max(100).optional(),
  season: z.string().max(20).optional(),
});

export const availabilitySchema = z.object({
  eventId: z.string().uuid(),
  status: z.enum(['AVAILABLE', 'NOT_AVAILABLE']),
  comment: z.string().max(500).optional(),
});

export const setLineupSchema = z.object({
  eventId: z.string().uuid(),
  teamId: z.string().uuid(),
  lineup: z.array(
    z.object({
      userId: z.string().uuid(),
      position: z.number().int().positive(),
    })
  ),
});

export const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  league: z.string().max(100).optional().nullable(),
  season: z.string().max(20).optional().nullable(),
});

export const addMembersSchema = z.object({
  userId: z.string().uuid(),
  position: z.number().int().positive().optional(),
});

export const updatePositionSchema = z.object({
  position: z.number().int().positive(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type AvailabilityInput = z.infer<typeof availabilitySchema>;
export type SetLineupInput = z.infer<typeof setLineupSchema>;
