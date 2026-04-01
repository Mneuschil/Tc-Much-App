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

export function useMyChallenges() {
  return useQuery({
    queryKey: ['myChallenges'],
    queryFn: rankingService.getChallenges,
  });
}

export function useCreateChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (challengedId: string) => rankingService.createChallenge(challengedId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myChallenges'] });
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
    },
  });
}

export function useRespondChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ challengeId, action }: { challengeId: string; action: 'ACCEPT' | 'DECLINE' }) =>
      rankingService.respondChallenge(challengeId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myChallenges'] });
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
    },
  });
}
