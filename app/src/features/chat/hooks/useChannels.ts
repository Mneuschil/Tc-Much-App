import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../services/chatService';
import type { CreateChannelInput } from '@tennis-club/shared';

export function useChannels() {
  return useQuery({
    queryKey: ['channels'],
    queryFn: chatService.getChannels,
  });
}

export function useChannel(channelId: string) {
  return useQuery({
    queryKey: ['channels', channelId],
    queryFn: () => chatService.getChannel(channelId),
    enabled: !!channelId,
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateChannelInput) => chatService.createChannel(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['channels'] }),
  });
}
