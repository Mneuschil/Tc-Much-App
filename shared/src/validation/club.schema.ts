import { z } from 'zod';

export const createClubSchema = z.object({
  name: z.string().min(1, 'Club-Name ist erforderlich').max(200),
  clubCode: z.string().min(3, 'Club-Code muss mindestens 3 Zeichen haben').max(20),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Ungueltige Farbe').default('#023320'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Ungueltige Farbe').default('#0EA65A'),
  address: z.string().max(500).optional(),
  website: z.string().url().optional(),
  logo: z.string().url().optional(),
});

export const updateClubSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  address: z.string().max(500).optional(),
  website: z.string().url().optional(),
  logo: z.string().url().optional(),
});

export const verifyClubCodeSchema = z.object({
  clubCode: z.string().min(1, 'Club-Code ist erforderlich'),
});

export type CreateClubInput = z.infer<typeof createClubSchema>;
export type UpdateClubInput = z.infer<typeof updateClubSchema>;
export type VerifyClubCodeInput = z.infer<typeof verifyClubCodeSchema>;
