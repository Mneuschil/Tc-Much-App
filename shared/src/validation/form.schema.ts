import { z } from 'zod';

export const courtDamageSchema = z.object({
  courtNumber: z.string().min(1, 'Platznummer ist erforderlich').max(10),
  description: z.string().min(1, 'Beschreibung ist erforderlich').max(2000),
  photoUrl: z.string().url('Foto ist erforderlich'),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']),
});

export const mediaUploadSchema = z.object({
  mediaUrls: z.array(z.string().url()).min(1, 'Mindestens ein Medium erforderlich'),
  category: z.string().min(1).max(100),
  tag: z.string().max(100).optional(),
});

export type CourtDamageInput = z.infer<typeof courtDamageSchema>;
export type MediaUploadInput = z.infer<typeof mediaUploadSchema>;
