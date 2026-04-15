import { useMutation, useQueryClient } from '@tanstack/react-query';
import { courtsService, type CreateCourtBookingInput } from '../services/courtsService';
import { useToast } from '../../../components/ui/Toast';
import { getErrorMessage } from '../../../utils/errorUtils';

export function useCreateBooking(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (input: CreateCourtBookingInput) => courtsService.createBooking(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courts', 'occupancy'] });
      showToast('Platzbelegung gespeichert');
      onSuccess?.();
    },
    onError: (err: Error) =>
      showToast(getErrorMessage(err, 'Belegung konnte nicht gespeichert werden'), 'error'),
  });
}
