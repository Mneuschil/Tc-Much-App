import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { chatService } from '../services/chatService';
import { getErrorMessage } from '../../../utils/errorUtils';

export function useMessages(channelId: string) {
  return useInfiniteQuery({
    queryKey: ['messages', channelId],
    queryFn: ({ pageParam }) => chatService.getMessages(channelId, pageParam, 20),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: { nextCursor: string | null; hasMore: boolean }) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled: !!channelId,
  });
}

export function useSendMessage(channelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { content: string; replyToId?: string; mediaUrls?: string[] }) =>
      chatService.sendMessage(channelId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages', channelId] }),
    onError: (err: Error) => {
      Alert.alert('Fehler', getErrorMessage(err, 'Nachricht konnte nicht gesendet werden'));
    },
  });
}

export function useDeleteMessage(channelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => chatService.deleteMessage(messageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages', channelId] }),
    onError: () => Alert.alert('Fehler', 'Nachricht konnte nicht gelöscht werden'),
  });
}

export function useAddReaction(channelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      messageId,
      type,
    }: {
      messageId: string;
      type: 'THUMBS_UP' | 'HEART' | 'CELEBRATE' | 'THINKING';
    }) => chatService.addReaction(messageId, type),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages', channelId] }),
  });
}
