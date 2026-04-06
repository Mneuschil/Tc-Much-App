import api from '../../../lib/api';
import { ENDPOINTS } from '../../../lib/endpoints';
import type { Team, TrainingAttendance } from '@tennis-club/shared';

export const trainingService = {
  getTrainingGroups: () => api.get<Team[]>(ENDPOINTS.training.groups),

  getAttendance: (eventId: string) =>
    api.get<TrainingAttendance[]>(ENDPOINTS.training.attendance(eventId)),

  setAttendance: (eventId: string, attending: boolean) =>
    api.put(ENDPOINTS.training.setAttendance, { eventId, attending }),

  getTrainerOverview: () => api.get(ENDPOINTS.training.overview),
};
