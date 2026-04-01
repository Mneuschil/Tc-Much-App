import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').max(200),
  description: z.string().max(2000).optional(),
  type: z.enum([
    'LEAGUE_MATCH',
    'CUP_MATCH',
    'CLUB_CHAMPIONSHIP',
    'RANKING_MATCH',
    'TRAINING',
    'CLUB_EVENT',
    'TOURNAMENT',
  ]),
  location: z.string().max(200).optional(),
  court: z.string().max(50).optional(),
  isHomeGame: z.boolean().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  teamId: z.string().uuid().optional(),
});

export const updateEventSchema = createEventSchema.partial();

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
