import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../services/chatService';
import { useAuthStore } from '../../../stores/authStore';
import type { CreateChannelInput } from '@tennis-club/shared';

export function useChannels() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['channels'],
    queryFn: chatService.getChannels,
    enabled: isAuthenticated,
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
