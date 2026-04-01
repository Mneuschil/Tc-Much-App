import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { fileService } from '../services/fileService';

export function useFiles(channelId: string, folderId?: string) {
  return useQuery({
    queryKey: ['files', channelId, folderId],
    queryFn: () => fileService.getFiles(channelId, folderId).then(r => r.data),
    enabled: !!channelId,
  });
}

export function useChannelFiles(channelId: string) {
  return useQuery({
    queryKey: ['files', channelId],
    queryFn: () => fileService.getFiles(channelId).then(r => r.data),
    enabled: !!channelId,
  });
}

export function useFolders(channelId: string) {
  return useQuery({
    queryKey: ['folders', channelId],
    queryFn: () => fileService.getFolders(channelId).then(r => r.data),
    enabled: !!channelId,
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, channelId }: { name: string; channelId?: string }) =>
      fileService.createFolder(name, channelId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['folders'] }),
    onError: () => Alert.alert('Fehler', 'Ordner konnte nicht erstellt werden'),
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fileId: string) => fileService.deleteFile(fileId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'] }),
    onError: () => Alert.alert('Fehler', 'Datei konnte nicht geloescht werden'),
  });
}
