import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { chatService } from '../services/chatService';
import { getErrorMessage } from '../../../utils/errorUtils';
import { useToast } from '../../../components/ui/Toast';

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
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (input: { content: string; replyToId?: string; mediaUrls?: string[] }) =>
      chatService.sendMessage(channelId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages', channelId] }),
    onError: (err: Error) => {
      showToast(getErrorMessage(err, 'Nachricht konnte nicht gesendet werden'), 'error');
    },
  });
}

export function useDeleteMessage(channelId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (messageId: string) => chatService.deleteMessage(messageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages', channelId] }),
    onError: () => showToast('Nachricht konnte nicht gelöscht werden', 'error'),
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
