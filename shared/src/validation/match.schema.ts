import { z } from 'zod';

const tennisSetSchema = z.object({
  games1: z.number().int().min(0).max(7),
  games2: z.number().int().min(0).max(7),
  tiebreak1: z.number().int().min(0).nullable().optional(),
  tiebreak2: z.number().int().min(0).nullable().optional(),
});

export const submitResultSchema = z.object({
  eventId: z.string().uuid(),
  sets: z.array(tennisSetSchema).min(1).max(5),
  winnerId: z.string().uuid(),
});

export const confirmResultSchema = z.object({
  resultId: z.string().uuid(),
});

export const rejectResultSchema = z.object({
  resultId: z.string().uuid(),
  rejectionReason: z.string().min(1, 'Ablehnungsgrund ist erforderlich').max(500),
  correctedSets: z.array(tennisSetSchema).min(1).max(5).optional(),
  correctedWinnerId: z.string().uuid().optional(),
});

export const resolveDisputeSchema = z.object({
  resultId: z.string().uuid(),
  sets: z.array(tennisSetSchema).min(1).max(5),
  winnerId: z.string().uuid(),
});

export type SubmitResultInput = z.infer<typeof submitResultSchema>;
export type ConfirmResultInput = z.infer<typeof confirmResultSchema>;
export type RejectResultInput = z.infer<typeof rejectResultSchema>;
export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>;
