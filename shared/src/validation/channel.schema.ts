import { z } from 'zod';

export const createChannelSchema = z.object({
  name: z.string().min(1, 'Kanalname ist erforderlich').max(100),
  description: z.string().max(500).optional(),
  visibility: z.enum(['PUBLIC', 'RESTRICTED']),
  parentChannelId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
});

export const createMessageSchema = z.object({
  content: z.string().min(1, 'Inhalt ist erforderlich').max(5000),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
  channelId: z.string().uuid(),
  replyToId: z.string().uuid().optional(),
});

export const messageReactionSchema = z.object({
  messageId: z.string().uuid(),
  type: z.enum(['THUMBS_UP', 'HEART', 'CELEBRATE', 'THINKING']),
});

export const messageSearchSchema = z.object({
  query: z.string().min(1).max(200),
  channelId: z.string().uuid().optional(),
});

export const updateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  visibility: z.enum(['PUBLIC', 'RESTRICTED']).optional(),
});

export type CreateChannelInput = z.infer<typeof createChannelSchema>;
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type MessageReactionInput = z.infer<typeof messageReactionSchema>;
export type MessageSearchInput = z.infer<typeof messageSearchSchema>;
