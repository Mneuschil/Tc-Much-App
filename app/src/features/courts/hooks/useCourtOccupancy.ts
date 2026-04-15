import { useQuery } from '@tanstack/react-query';
import { courtsService } from '../services/courtsService';

export function useCourtOccupancy(date: string) {
  return useQuery({
    queryKey: ['courts', 'occupancy', date],
    queryFn: () => courtsService.getOccupancy(date),
  });
}
