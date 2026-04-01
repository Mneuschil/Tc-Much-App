import { z } from 'zod';

export const initializeRankingSchema = z.object({
  category: z.string().min(1).optional(),
  rankings: z.array(
    z.object({
      userId: z.string().uuid(),
      rank: z.number().int().positive(),
      points: z.number().int().min(0).optional(),
    })
  ).min(1),
});

export type InitializeRankingInput = z.infer<typeof initializeRankingSchema>;

export const respondChallengeSchema = z.object({
  action: z.enum(['ACCEPT', 'DECLINE']),
});

export type RespondChallengeInput = z.infer<typeof respondChallengeSchema>;
