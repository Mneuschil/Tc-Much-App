import api from '../../../lib/api';
import { ENDPOINTS } from '../../../lib/endpoints';
import type { File, FileFolder } from '@tennis-club/shared';

export const fileService = {
  getFiles: (channelId: string, folderId?: string) =>
    api.get<File[]>(ENDPOINTS.files.channel(channelId), {
      params: folderId ? { folderId } : undefined,
    }),

  getFolders: (channelId: string) => api.get<FileFolder[]>(ENDPOINTS.files.folders(channelId)),

  createFolder: (name: string, channelId?: string) =>
    api.post<FileFolder>(ENDPOINTS.files.createFolder, { name, channelId }),

  deleteFile: (fileId: string) => api.delete(ENDPOINTS.files.delete(fileId)),
};
