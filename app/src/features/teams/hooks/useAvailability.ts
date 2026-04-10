import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamService } from '../services/teamService';
import { getErrorMessage } from '../../../utils/errorUtils';
import { useToast } from '../../../components/ui/Toast';

export function useAvailability(eventId: string) {
  return useQuery({
    queryKey: ['availability', eventId],
    queryFn: () => teamService.getAvailability(eventId),
    enabled: !!eventId,
  });
}

export function useSetAvailability(eventId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: ({
      status,
      comment,
    }: {
      status: 'AVAILABLE' | 'NOT_AVAILABLE' | 'MAYBE';
      comment?: string;
    }) => teamService.setAvailability(eventId, status, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      showToast('Verfügbarkeit gespeichert');
    },
    onError: (err: Error) => {
      showToast(getErrorMessage(err, 'Verfügbarkeit konnte nicht gespeichert werden'), 'error');
    },
  });
}
