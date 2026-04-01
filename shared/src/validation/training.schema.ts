import { z } from 'zod';

export const setAttendanceSchema = z.object({
  eventId: z.string().uuid(),
  attending: z.boolean(),
});

export type SetAttendanceInput = z.infer<typeof setAttendanceSchema>;
