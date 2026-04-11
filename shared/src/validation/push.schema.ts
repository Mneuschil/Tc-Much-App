import { z } from 'zod';

export const registerPushTokenSchema = z.object({
  token: z.string().min(1, 'Push-Token ist erforderlich'),
  platform: z.enum(['IOS', 'ANDROID'], {
    errorMap: () => ({ message: 'Platform muss IOS oder ANDROID sein' }),
  }),
});

export type RegisterPushTokenInput = z.infer<typeof registerPushTokenSchema>;
