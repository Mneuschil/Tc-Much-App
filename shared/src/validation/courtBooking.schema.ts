import { z } from 'zod';
import { trainingTypeEnum } from './event.schema';

export const courtBookingCategoryEnum = z.enum([
  'TRAINING',
  'MEDENSPIEL',
  'WETTSPIEL',
  'CLUB_EVENT',
]);

export const createCourtBookingSchema = z
  .object({
    category: courtBookingCategoryEnum,
    court: z.number().int().min(1).max(10),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    title: z.string().min(1, 'Titel ist erforderlich').max(200),
    description: z.string().max(2000).optional(),

    // Medenspiel
    opponentName: z.string().max(200).optional(),
    isHomeGame: z.boolean().optional(),
    teamId: z.string().uuid().optional(),

    // Training
    trainingType: trainingTypeEnum.optional(),
  })
  .refine((v) => new Date(v.endDate) > new Date(v.startDate), {
    message: 'Ende muss nach Start liegen',
    path: ['endDate'],
  })
  .refine((v) => v.category !== 'TRAINING' || !!v.trainingType, {
    message: 'Trainings-Typ ist erforderlich',
    path: ['trainingType'],
  })
  .refine(
    (v) => v.category !== 'TRAINING' || v.trainingType !== 'MANNSCHAFTSTRAINING' || !!v.teamId,
    { message: 'Mannschaft ist erforderlich für Mannschaftstraining', path: ['teamId'] },
  )
  .refine((v) => v.category !== 'MEDENSPIEL' || !!v.opponentName, {
    message: 'Gegner ist erforderlich',
    path: ['opponentName'],
  });

export type CreateCourtBookingInput = z.infer<typeof createCourtBookingSchema>;
