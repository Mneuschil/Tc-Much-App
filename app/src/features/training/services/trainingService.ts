import api from '../../../lib/api';
import { ENDPOINTS } from '../../../lib/endpoints';
import type { Team } from '@tennis-club/shared';

export const trainingService = {
  getTrainingGroups: () =>
    api.get<{ data: Team[] }>(ENDPOINTS.training.groups).then((r) => r.data.data),

  getAttendance: (eventId: string) =>
    api.get(ENDPOINTS.training.attendance(eventId)).then((r) => r.data.data),

  setAttendance: (eventId: string, attending: boolean) =>
    api.put(ENDPOINTS.training.setAttendance, { eventId, attending }).then((r) => r.data.data),

  getTrainerOverview: () => api.get(ENDPOINTS.training.overview).then((r) => r.data.data),
};
