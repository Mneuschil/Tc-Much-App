import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamService } from '../services/teamService';

export function useLineup(eventId: string) {
  return useQuery({
    queryKey: ['lineup', eventId],
    queryFn: () => teamService.getLineup(eventId),
    enabled: !!eventId,
  });
}

export function useSetLineup(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, lineup }: { teamId: string; lineup: { userId: string; position: number }[] }) =>
      teamService.setLineup(eventId, teamId, lineup),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lineup', eventId] }),
  });
}

export function useAutoGenerateLineup(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (teamId: string) => teamService.autoGenerateLineup(eventId, teamId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lineup', eventId] }),
  });
}
