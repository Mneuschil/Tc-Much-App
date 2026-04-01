import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingService } from '../services/trainingService';

export function useTrainingGroups() {
  return useQuery({
    queryKey: ['trainingGroups'],
    queryFn: trainingService.getTrainingGroups,
  });
}

export function useTrainingAttendance(eventId: string) {
  return useQuery({
    queryKey: ['trainingAttendance', eventId],
    queryFn: () => trainingService.getAttendance(eventId),
    enabled: !!eventId,
  });
}

export function useSetTrainingAttendance(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attending: boolean) => trainingService.setAttendance(eventId, attending),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trainingAttendance', eventId] }),
  });
}

export function useTrainerOverview() {
  return useQuery({
    queryKey: ['trainerOverview'],
    queryFn: trainingService.getTrainerOverview,
  });
}
