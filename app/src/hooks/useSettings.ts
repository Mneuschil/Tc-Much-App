import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { chatService } from '../features/chat/services/chatService';
import { getErrorMessage } from '../utils/errorUtils';
import api from '../lib/api';
import type { Channel } from '@tennis-club/shared';

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
      api.post(`/channels/${channelId}/mute`).then((r) => r.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['channels'] }),
    onError: (err: Error) =>
      Alert.alert('Fehler', getErrorMessage(err, 'Stummschaltung fehlgeschlagen')),
  });
}
