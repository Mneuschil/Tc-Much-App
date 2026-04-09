import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { AxiosError } from 'axios';
import { teamService } from '../services/teamService';
import type { CreateTeamInput, UpdateTeamInput } from '@tennis-club/shared';

interface ApiErrorResponse {
  error?: { message?: string };
}

function getErrorMessage(err: Error, fallback: string): string {
  const axiosErr = err as AxiosError<ApiErrorResponse>;
  return axiosErr.response?.data?.error?.message ?? fallback;
}

export function useTeams(type?: string) {
  return useQuery({
    queryKey: ['teams', type],
    queryFn: () => teamService.getTeams(type),
  });
}

export function useTeam(teamId: string) {
  return useQuery({
    queryKey: ['teams', teamId],
    queryFn: () => teamService.getTeam(teamId),
    enabled: !!teamId,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTeamInput) => teamService.createTeam(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });
}

export function useUpdateTeam(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTeamInput) => teamService.updateTeam(teamId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (err: Error) =>
      Alert.alert('Fehler', getErrorMessage(err, 'Team konnte nicht aktualisiert werden')),
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (teamId: string) => teamService.deleteTeam(teamId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
    onError: (err: Error) =>
      Alert.alert('Fehler', getErrorMessage(err, 'Team konnte nicht gelöscht werden')),
  });
}

export function useEnsureTeamChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (teamId: string) => teamService.ensureChannel(teamId),
    onSuccess: (_data, teamId) => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
    },
  });
}

export function useAddTeamMember(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, position }: { userId: string; position?: number }) =>
      teamService.addMember(teamId, userId, position),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (err: Error) =>
      Alert.alert('Fehler', getErrorMessage(err, 'Mitglied konnte nicht hinzugefügt werden')),
  });
}

export function useRemoveTeamMember(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => teamService.removeMember(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (err: Error) =>
      Alert.alert('Fehler', getErrorMessage(err, 'Mitglied konnte nicht entfernt werden')),
  });
}
