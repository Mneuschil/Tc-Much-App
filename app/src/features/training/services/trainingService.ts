import api from '../../../lib/api';
import type { Team, TrainingAttendance } from '@tennis-club/shared';

export const trainingService = {
  getTrainingGroups: () =>
    api.get<Team[]>('/training/groups'),

  getAttendance: (eventId: string) =>
    api.get<TrainingAttendance[]>(`/training/attendance/${eventId}`),

  setAttendance: (eventId: string, attending: boolean) =>
    api.put('/training/attendance', { eventId, attending }),

  getTrainerOverview: () =>
    api.get('/training/overview'),
};
