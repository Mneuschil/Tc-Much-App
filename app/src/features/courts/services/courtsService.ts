import api from '../../../lib/api';
import { ENDPOINTS } from '../../../lib/endpoints';

export type CourtCategory = 'TRAINING' | 'MEDENSPIEL' | 'CLUB_EVENT' | 'OTHER';

export type TrainingType =
  | 'MANNSCHAFTSTRAINING'
  | 'JUGENDTRAINING'
  | 'SCHNUPPERSTUNDE'
  | 'PRIVATGRUPPE';

export interface CourtSlot {
  id: string;
  court: number;
  startTime: string;
  endTime: string;
  category: CourtCategory;
  title: string;
  trainingType: TrainingType | null;
  teamShortCode: string | null;
  teamName: string | null;
  opponentName: string | null;
  isHomeGame: boolean | null;
}

export interface CourtSlotDetail extends CourtSlot {
  description: string | null;
  lineup: Array<{
    position: number;
    userId: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  }>;
}

export interface CreateCourtBookingInput {
  category: 'TRAINING' | 'MEDENSPIEL' | 'CLUB_EVENT';
  court: number;
  startDate: string;
  endDate: string;
  title: string;
  description?: string;
  opponentName?: string;
  isHomeGame?: boolean;
  teamId?: string;
  trainingType?: TrainingType;
}

export const courtsService = {
  getOccupancy: (date: string): Promise<CourtSlot[]> =>
    api.get(ENDPOINTS.courts.occupancy, { params: { date } }).then((r) => r.data.data),

  getSlotDetail: (eventId: string): Promise<CourtSlotDetail> =>
    api.get(ENDPOINTS.courts.slot(eventId)).then((r) => r.data.data),

  createBooking: (input: CreateCourtBookingInput): Promise<unknown> =>
    api.post(ENDPOINTS.courts.bookings, input).then((r) => r.data.data),
};
