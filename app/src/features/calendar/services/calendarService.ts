import api from '../../../lib/api';
import { ENDPOINTS } from '../../../lib/endpoints';

export const calendarService = {
  getEvents: (type?: string, from?: string, to?: string, teamId?: string) => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (teamId) params.set('teamId', teamId);
    return api.get(`${ENDPOINTS.calendar.list}?${params.toString()}`).then((r) => r.data.data);
  },

  getWeekEvents: () => api.get(ENDPOINTS.calendar.week).then((r) => r.data.data),

  getEvent: (eventId: string) => api.get(ENDPOINTS.events.detail(eventId)).then((r) => r.data.data),

  createEvent: (input: Record<string, unknown>) =>
    api.post(ENDPOINTS.events.create, input).then((r) => r.data.data),

  updateEvent: (eventId: string, input: Record<string, unknown>) =>
    api.put(ENDPOINTS.events.update(eventId), input).then((r) => r.data),

  deleteEvent: (eventId: string) =>
    api.delete(ENDPOINTS.events.delete(eventId)).then((r) => r.data),
};
