import api from '../../../lib/api';

export const teamService = {
  getTeams: (type?: string) =>
    api.get(`/teams${type ? `?type=${type}` : ''}`).then(r => r.data.data),

  getTeam: (teamId: string) =>
    api.get(`/teams/${teamId}`).then(r => r.data.data),

  createTeam: (input: any) =>
    api.post('/teams', input).then(r => r.data.data),

  addMember: (teamId: string, userId: string, position?: number) =>
    api.post(`/teams/${teamId}/members`, { userId, position }).then(r => r.data.data),

  removeMember: (teamId: string, userId: string) =>
    api.delete(`/teams/${teamId}/members/${userId}`).then(r => r.data),

  getAvailability: (eventId: string) =>
    api.get(`/events/${eventId}/availability`).then(r => r.data.data),

  setAvailability: (eventId: string, status: 'AVAILABLE' | 'NOT_AVAILABLE' | 'MAYBE', comment?: string) =>
    api.put(`/events/${eventId}/availability`, { eventId, status, comment }).then(r => r.data.data),

  getLineup: (eventId: string) =>
    api.get(`/matches/lineup/${eventId}`).then(r => r.data.data),

  setLineup: (eventId: string, teamId: string, lineup: { userId: string; position: number }[]) =>
    api.put('/matches/lineup', { eventId, teamId, lineup }).then(r => r.data.data),

  autoGenerateLineup: (eventId: string, teamId: string) =>
    api.post(`/matches/lineup/${eventId}/auto`, { teamId }).then(r => r.data.data),
};
