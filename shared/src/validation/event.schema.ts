import { z } from 'zod';

export const eventTypeEnum = z.enum([
  'LEAGUE_MATCH',
  'CUP_MATCH',
  'CLUB_CHAMPIONSHIP',
  'RANKING_MATCH',
  'TRAINING',
  'CLUB_EVENT',
  'TOURNAMENT',
]);

export const trainingTypeEnum = z.enum([
  'MANNSCHAFTSTRAINING',
  'JUGENDTRAINING',
  'SCHNUPPERSTUNDE',
  'PRIVATGRUPPE',
]);

export const createEventSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').max(200),
  description: z.string().max(2000).optional(),
  type: eventTypeEnum,
  trainingType: trainingTypeEnum.optional(),
  location: z.string().max(200).optional(),
  court: z.string().max(50).optional(),
  opponentName: z.string().max(200).optional(),
  isHomeGame: z.boolean().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  teamId: z.string().uuid().optional(),
});

export const updateEventSchema = createEventSchema.partial();

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
