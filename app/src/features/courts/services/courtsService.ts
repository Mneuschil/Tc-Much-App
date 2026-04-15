import api from '../../../lib/api';
import { ENDPOINTS } from '../../../lib/endpoints';

export type CourtCategory = 'TRAINING' | 'MATCH' | 'RANKING' | 'OTHER';

export interface CourtSlot {
  id: string;
  court: number;
  startTime: string;
  endTime: string;
  category: CourtCategory;
  title: string;
  teamName: string | null;
}

export const courtsService = {
  getOccupancy: (date: string): Promise<CourtSlot[]> =>
    api.get(ENDPOINTS.courts.occupancy, { params: { date } }).then((r) => r.data.data),
};
