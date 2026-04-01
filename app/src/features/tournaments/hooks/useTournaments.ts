import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { tournamentService } from '../services/tournamentService';
import type { TournamentRegistrationInput } from '@tennis-club/shared';

export function useTournaments() {
  return useQuery({
    queryKey: ['tournaments'],
    queryFn: tournamentService.getTournaments,
  });
}

export function useTournamentDetail(id: string) {
  return useQuery({
    queryKey: ['tournaments', id],
    queryFn: () => tournamentService.getTournament(id),
    enabled: !!id,
  });
}

export function useBracket(id: string) {
  return useQuery({
    queryKey: ['tournaments', id, 'bracket'],
    queryFn: () => tournamentService.getBracket(id),
    enabled: !!id,
  });
}

export function useRegistrations(id: string) {
  return useQuery({
    queryKey: ['tournaments', id, 'registrations'],
    queryFn: () => tournamentService.getRegistrations(id),
    enabled: !!id,
  });
}

export function useRegisterForTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TournamentRegistrationInput) => tournamentService.register(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tournaments', variables.tournamentId, 'registrations'] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
    onError: () => Alert.alert('Fehler', 'Anmeldung fehlgeschlagen'),
  });
}
