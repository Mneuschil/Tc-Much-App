import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../features/chat/services/chatService';
import { getErrorMessage } from '../utils/errorUtils';
import { useToast } from '../components/ui/Toast';
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
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (channelId: string) =>
      api.post(`/channels/${channelId}/mute`).then((r) => r.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['channels'] }),
    onError: (err: Error) =>
      showToast(getErrorMessage(err, 'Stummschaltung fehlgeschlagen'), 'error'),
  });
}
