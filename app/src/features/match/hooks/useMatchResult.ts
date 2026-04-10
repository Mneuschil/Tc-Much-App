import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchService } from '../services/matchService';
import { getErrorMessage } from '../../../utils/errorUtils';
import { useToast } from '../../../components/ui/Toast';
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
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (input: {
      matchId: string;
      sets: TennisSet[];
      winnerId: string;
      eventId: string;
    }) => matchService.submitResult(input.matchId, { sets: input.sets, winnerId: input.winnerId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['matchResults', variables.eventId] });
      showToast('Ergebnis eingereicht');
    },
    onError: (err: Error) => {
      showToast(getErrorMessage(err, 'Ergebnis konnte nicht eingereicht werden'), 'error');
    },
  });
}

export function useConfirmResult(eventId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: () => matchService.confirmResult(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchResults', eventId] });
      showToast('Ergebnis bestätigt');
    },
    onError: (err: Error) => {
      showToast(getErrorMessage(err, 'Ergebnis konnte nicht bestätigt werden'), 'error');
    },
  });
}

export function useRejectResult(eventId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: ({
      reason,
      correctedSets,
      correctedWinnerId,
    }: {
      reason: string;
      correctedSets?: TennisSet[];
      correctedWinnerId?: string;
    }) => matchService.rejectResult(eventId, reason, correctedSets, correctedWinnerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matchResults', eventId] }),
    onError: (err: Error) => {
      showToast(getErrorMessage(err, 'Ablehnung fehlgeschlagen'), 'error');
    },
  });
}
