import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formService } from '../features/forms/services/formService';
import { getErrorMessage } from '../utils/errorUtils';
import { useToast } from '../components/ui/Toast';

export function useSubmitCourtDamage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (formData: FormData) => formService.submitCourtDamage(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myReports'] });
      showToast('Meldung gesendet');
    },
    onError: (err: Error) =>
      showToast(getErrorMessage(err, 'Meldung konnte nicht gesendet werden'), 'error'),
  });
}

export function useMyReports() {
  return useQuery({
    queryKey: ['myReports'],
    queryFn: () => formService.getMyReports(),
  });
}

export function useSubmitMedia() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (formData: FormData) => formService.submitMediaUpload(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myReports'] });
      showToast('Upload erfolgreich');
    },
    onError: (err: Error) => showToast(getErrorMessage(err, 'Upload fehlgeschlagen'), 'error'),
  });
}
