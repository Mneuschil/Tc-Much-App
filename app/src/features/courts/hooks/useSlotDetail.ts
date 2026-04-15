import { useQuery } from '@tanstack/react-query';
import { courtsService } from '../services/courtsService';

export function useSlotDetail(eventId: string | null) {
  return useQuery({
    queryKey: ['courts', 'slot', eventId],
    queryFn: () => courtsService.getSlotDetail(eventId as string),
    enabled: !!eventId,
  });
}
