import { z } from 'zod';

export const createTournamentSchema = z.object({
  name: z.string().min(1, 'Turniername ist erforderlich').max(100),
  type: z.enum(['KNOCKOUT', 'LADDER', 'ROUND_ROBIN']),
  category: z.enum(['SINGLES', 'DOUBLES', 'MIXED']),
  description: z.string().max(1000).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  maxParticipants: z.number().int().positive().optional(),
});

export const tournamentRegistrationSchema = z.object({
  tournamentId: z.string().uuid(),
  partnerId: z.string().uuid().optional(),
});

export const reportResultSchema = z.object({
  matchId: z.string().uuid(),
  winnerId: z.string().uuid(),
  score: z.string().min(1, 'Ergebnis ist erforderlich').max(50),
});

export const createChallengeSchema = z.object({
  challengedId: z.string().uuid(),
  category: z.string().min(1).optional(),
  deadline: z.string().datetime().optional(),
});

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
export type TournamentRegistrationInput = z.infer<typeof tournamentRegistrationSchema>;
export type ReportResultInput = z.infer<typeof reportResultSchema>;
export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;
