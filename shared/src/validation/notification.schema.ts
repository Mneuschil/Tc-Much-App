import { z } from 'zod';

export const updateNotificationPreferenceSchema = z.object({
  type: z.enum([
    'CHAT_MESSAGE',
    'MENTION',
    'AVAILABILITY_REQUEST',
    'RESULT_CONFIRMATION',
    'EVENT_CHANGE',
    'TODO',
    'SYSTEM',
  ]),
  enabled: z.boolean(),
});

export type UpdateNotificationPreferenceInput = z.infer<typeof updateNotificationPreferenceSchema>;
