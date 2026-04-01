import api from '../../../lib/api';

export const calendarService = {
  getEvents: (type?: string, from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return api.get(`/calendar?${params.toString()}`).then(r => r.data.data);
  },

  getWeekEvents: () =>
    api.get('/calendar/week').then(r => r.data.data),

  getEvent: (eventId: string) =>
    api.get(`/events/${eventId}`).then(r => r.data.data),

  createEvent: (input: any) =>
    api.post('/events', input).then(r => r.data.data),

  updateEvent: (eventId: string, input: any) =>
    api.put(`/events/${eventId}`, input).then(r => r.data),

  deleteEvent: (eventId: string) =>
    api.delete(`/events/${eventId}`).then(r => r.data),
};
