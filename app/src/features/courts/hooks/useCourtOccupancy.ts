import { useQuery } from '@tanstack/react-query';
import { courtsService } from '../services/courtsService';

export function useCourtOccupancy(date: string) {
  return useQuery({
    queryKey: ['courts', 'occupancy', date],
    queryFn: () => courtsService.getOccupancy(date),
  });
}

export function useCourtOccupancyRange(from: string, to: string) {
  return useQuery({
    queryKey: ['courts', 'occupancy', 'range', from, to],
    queryFn: () => courtsService.getOccupancyRange(from, to),
    enabled: !!from && !!to,
  });
}
