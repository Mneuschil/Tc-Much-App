import api from '../../../lib/api';
import type { File, FileFolder } from '@tennis-club/shared';

export const fileService = {
  getFiles: (channelId: string, folderId?: string) =>
    api.get<File[]>(`/files/channel/${channelId}${folderId ? `?folderId=${folderId}` : ''}`),

  getFolders: (channelId: string) =>
    api.get<FileFolder[]>(`/files/folders/${channelId}`),

  createFolder: (name: string, channelId?: string) =>
    api.post<FileFolder>('/files/folders', { name, channelId }),

  deleteFile: (fileId: string) =>
    api.delete(`/files/${fileId}`),
};
