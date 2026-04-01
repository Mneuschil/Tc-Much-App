import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { chatService } from '../services/chatService';

export function useMessages(channelId: string) {
  return useInfiniteQuery({
    queryKey: ['messages', channelId],
    queryFn: ({ pageParam = 1 }) => chatService.getMessages(channelId, pageParam, 20),
    initialPageParam: 1,
    getNextPageParam: (_lastPage, allPages) => allPages.length + 1,
    enabled: !!channelId,
  });
}

export function useSendMessage(channelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { content: string; replyToId?: string; mediaUrls?: string[] }) =>
      chatService.sendMessage(channelId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages', channelId] }),
    onError: (err: any) => Alert.alert('Fehler', err?.response?.data?.error?.message ?? 'Nachricht konnte nicht gesendet werden'),
  });
}

export function useDeleteMessage(channelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => chatService.deleteMessage(messageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages', channelId] }),
    onError: () => Alert.alert('Fehler', 'Nachricht konnte nicht geloescht werden'),
  });
}

export function useAddReaction(channelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, type }: { messageId: string; type: 'THUMBS_UP' | 'HEART' | 'CELEBRATE' | 'THINKING' }) =>
      chatService.addReaction(messageId, type),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages', channelId] }),
  });
}
