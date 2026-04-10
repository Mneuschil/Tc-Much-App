import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fileService } from '../services/fileService';
import api from '../../../lib/api';
import { ENDPOINTS } from '../../../lib/endpoints';
import { appendFileToFormData } from '../../../utils/createFileFormData';
import { useToast } from '../../../components/ui/Toast';

interface UploadInput {
  uri: string;
  fileName: string;
  mimeType: string;
  displayName: string;
  channelId: string;
  folderId?: string;
}

export function useChannelFiles(channelId: string, folderId?: string) {
  return useQuery({
    queryKey: ['files', channelId, folderId ?? null],
    queryFn: () => fileService.getFiles(channelId, folderId).then((r) => r.data.data),
    enabled: !!channelId,
  });
}

export function useFolders(channelId: string) {
  return useQuery({
    queryKey: ['folders', channelId],
    queryFn: () => fileService.getFolders(channelId).then((r) => r.data.data),
    enabled: !!channelId,
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: async (input: UploadInput) => {
      const formData = new FormData();
      appendFileToFormData(formData, 'file', input.uri, input.displayName, input.mimeType);
      formData.append('channelId', input.channelId);
      if (input.folderId) formData.append('folderId', input.folderId);
      return api.post(ENDPOINTS.files.upload, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: ['files', input.channelId] });
      showToast('Datei hochgeladen');
    },
    onError: () => showToast('Datei konnte nicht hochgeladen werden', 'error'),
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: ({ name, channelId }: { name: string; channelId: string }) =>
      fileService.createFolder(name, channelId),
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: ['folders', input.channelId] });
      showToast('Ordner erstellt');
    },
    onError: () => showToast('Ordner konnte nicht erstellt werden', 'error'),
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (fileId: string) => fileService.deleteFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      showToast('Datei gelöscht');
    },
    onError: () => showToast('Datei konnte nicht gelöscht werden', 'error'),
  });
}
