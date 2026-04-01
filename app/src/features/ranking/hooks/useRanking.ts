import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rankingService } from '../services/rankingService';
import type { InitializeRankingInput } from '@tennis-club/shared';

export function useRankings() {
  return useQuery({
    queryKey: ['rankings'],
    queryFn: rankingService.getRankings,
  });
}

export function useMatchHistory(userId: string) {
  return useQuery({
    queryKey: ['matchHistory', userId],
    queryFn: () => rankingService.getMatchHistory(userId),
    enabled: !!userId,
  });
}

export function useInitializeRanking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InitializeRankingInput) => rankingService.initializeRanking(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rankings'] }),
  });
}
