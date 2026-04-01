import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamService } from '../services/teamService';
import type { CreateTeamInput } from '@tennis-club/shared';

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
