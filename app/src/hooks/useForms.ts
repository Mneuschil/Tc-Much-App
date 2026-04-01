import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { AxiosError } from 'axios';
import { formService } from '../features/forms/services/formService';

interface ApiErrorResponse {
  error?: { message?: string };
}

function getErrorMessage(err: Error, fallback: string): string {
  const axiosErr = err as AxiosError<ApiErrorResponse>;
  return axiosErr.response?.data?.error?.message ?? fallback;
}

export function useSubmitCourtDamage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => formService.submitCourtDamage(formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myReports'] }),
    onError: (err: Error) => Alert.alert('Fehler', getErrorMessage(err, 'Meldung konnte nicht gesendet werden')),
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
  return useMutation({
    mutationFn: (formData: FormData) => formService.submitMediaUpload(formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myReports'] }),
    onError: (err: Error) => Alert.alert('Fehler', getErrorMessage(err, 'Upload fehlgeschlagen')),
  });
}
