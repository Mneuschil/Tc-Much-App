import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().max(30).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
});

export const updateRolesSchema = z.object({
  roles: z.array(
    z.enum(['MEMBER', 'TRAINER', 'BOARD_MEMBER', 'TEAM_CAPTAIN', 'PARENT', 'CLUB_ADMIN', 'SYSTEM_ADMIN']),
  ).min(1, 'Mindestens eine Rolle erforderlich'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateRolesInput = z.infer<typeof updateRolesSchema>;
