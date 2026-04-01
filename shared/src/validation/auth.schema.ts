import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Ungueltige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
  firstName: z.string().min(1, 'Vorname ist erforderlich').max(50),
  lastName: z.string().min(1, 'Nachname ist erforderlich').max(50),
  clubCode: z.string().min(1, 'Club-Code ist erforderlich').max(20),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Ungueltige E-Mail-Adresse'),
  password: z.string().min(1, 'Passwort ist erforderlich'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh-Token ist erforderlich'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Aktuelles Passwort ist erforderlich'),
  newPassword: z.string().min(8, 'Neues Passwort muss mindestens 8 Zeichen lang sein'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
