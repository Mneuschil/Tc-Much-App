import { z } from 'zod';

export const createFolderSchema = z.object({
  name: z.string().min(1, 'Ordnername ist erforderlich').max(100),
  channelId: z.string().uuid().optional(),
});

export const uploadFileSchema = z.object({
  name: z.string().min(1).max(255),
  channelId: z.string().uuid().optional(),
  folderId: z.string().uuid().optional(),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UploadFileInput = z.infer<typeof uploadFileSchema>;
