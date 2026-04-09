import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { teamService } from '../services/teamService';
import { getErrorMessage } from '../../../utils/errorUtils';

export function useAvailability(eventId: string) {
  return useQuery({
    queryKey: ['availability', eventId],
    queryFn: () => teamService.getAvailability(eventId),
    enabled: !!eventId,
  });
}

export function useSetAvailability(eventId: string) {
  const queryClient = useQueryClient();
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
    },
    onError: (err: Error) => {
      Alert.alert('Fehler', getErrorMessage(err, 'Verfügbarkeit konnte nicht gespeichert werden'));
    },
  });
}
