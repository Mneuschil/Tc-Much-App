import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { AxiosError } from 'axios';
import { chatService } from '../features/chat/services/chatService';
import api from '../lib/api';
import type { Channel } from '@tennis-club/shared';

interface ApiErrorResponse {
  error?: { message?: string };
}

export function useChannelList() {
  return useQuery<Channel[]>({
    queryKey: ['channels'],
    queryFn: () => chatService.getChannels(),
  });
}

export function useToggleMute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) =>
      api.post(`/channels/${channelId}/mute`).then(r => r.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['channels'] }),
    onError: (err: Error) => {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      Alert.alert('Fehler', axiosErr.response?.data?.error?.message ?? 'Stummschaltung fehlgeschlagen');
    },
  });
}
