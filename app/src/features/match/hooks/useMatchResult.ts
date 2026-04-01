import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { matchService } from '../services/matchService';
import type { TennisSet } from '@tennis-club/shared';

export function useMatchResults(eventId: string) {
  return useQuery({
    queryKey: ['matchResults', eventId],
    queryFn: () => matchService.getResultsForEvent(eventId),
    enabled: !!eventId,
  });
}

export function useSubmitResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => matchService.submitResult(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['matchResults', variables.eventId] });
      Alert.alert('Erfolg', 'Ergebnis eingereicht');
    },
    onError: (err: any) => Alert.alert('Fehler', err?.response?.data?.error?.message ?? 'Ergebnis konnte nicht eingereicht werden'),
  });
}

export function useConfirmResult(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (resultId: string) => matchService.confirmResult(resultId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchResults', eventId] });
      Alert.alert('Erfolg', 'Ergebnis bestaetigt');
    },
    onError: (err: any) => Alert.alert('Fehler', err?.response?.data?.error?.message ?? 'Ergebnis konnte nicht bestaetigt werden'),
  });
}

export function useRejectResult(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ resultId, reason, correctedSets, correctedWinnerId }: {
      resultId: string; reason: string; correctedSets?: TennisSet[]; correctedWinnerId?: string;
    }) => matchService.rejectResult(resultId, reason, correctedSets, correctedWinnerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matchResults', eventId] }),
    onError: (err: any) => Alert.alert('Fehler', err?.response?.data?.error?.message ?? 'Ablehnung fehlgeschlagen'),
  });
}
