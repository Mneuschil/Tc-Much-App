import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamService } from '../services/teamService';
import { getErrorMessage } from '../../../utils/errorUtils';
import { useToast } from '../../../components/ui/Toast';
import type { CreateTeamInput, UpdateTeamInput } from '@tennis-club/shared';

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
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (input: CreateTeamInput) => teamService.createTeam(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      showToast('Team erstellt');
    },
  });
}

export function useUpdateTeam(teamId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (input: UpdateTeamInput) => teamService.updateTeam(teamId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      showToast('Team aktualisiert');
    },
    onError: (err: Error) =>
      showToast(getErrorMessage(err, 'Team konnte nicht aktualisiert werden'), 'error'),
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (teamId: string) => teamService.deleteTeam(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      showToast('Team gelöscht');
    },
    onError: (err: Error) =>
      showToast(getErrorMessage(err, 'Team konnte nicht gelöscht werden'), 'error'),
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
  const { showToast } = useToast();
  return useMutation({
    mutationFn: ({ userId, position }: { userId: string; position?: number }) =>
      teamService.addMember(teamId, userId, position),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      showToast('Mitglied hinzugefügt');
    },
    onError: (err: Error) =>
      showToast(getErrorMessage(err, 'Mitglied konnte nicht hinzugefügt werden'), 'error'),
  });
}

export function useRemoveTeamMember(teamId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (userId: string) => teamService.removeMember(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      showToast('Mitglied entfernt');
    },
    onError: (err: Error) =>
      showToast(getErrorMessage(err, 'Mitglied konnte nicht entfernt werden'), 'error'),
  });
}
