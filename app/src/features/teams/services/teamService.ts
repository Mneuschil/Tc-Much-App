import api from '../../../lib/api';
import { ENDPOINTS } from '../../../lib/endpoints';

export const teamService = {
  getTeams: (type?: string) =>
    api.get(ENDPOINTS.teams.list, { params: type ? { type } : undefined }).then((r) => r.data.data),

  getTeam: (teamId: string) => api.get(ENDPOINTS.teams.detail(teamId)).then((r) => r.data.data),

  createTeam: (input: Record<string, unknown>) =>
    api.post(ENDPOINTS.teams.create, input).then((r) => r.data.data),

  updateTeam: (
    teamId: string,
    input: { name?: string; league?: string | null; season?: string | null },
  ) => api.put(ENDPOINTS.teams.detail(teamId), input).then((r) => r.data.data),

  deleteTeam: (teamId: string) => api.delete(ENDPOINTS.teams.detail(teamId)).then((r) => r.data),

  addMember: (teamId: string, userId: string, position?: number) =>
    api.post(ENDPOINTS.teams.addMember(teamId), { userId, position }).then((r) => r.data.data),

  removeMember: (teamId: string, userId: string) =>
    api.delete(ENDPOINTS.teams.removeMember(teamId, userId)).then((r) => r.data),

  ensureChannel: (teamId: string) =>
    api.post(ENDPOINTS.teams.ensureChannel(teamId)).then((r) => r.data.data),

  getAvailability: (eventId: string) =>
    api.get(ENDPOINTS.events.availability(eventId)).then((r) => r.data.data),

  setAvailability: (
    eventId: string,
    status: 'AVAILABLE' | 'NOT_AVAILABLE' | 'MAYBE',
    comment?: string,
  ) =>
    api
      .put(ENDPOINTS.events.availability(eventId), { eventId, status, comment })
      .then((r) => r.data.data),

  getLineup: (eventId: string) =>
    api.get(ENDPOINTS.matches.lineup(eventId)).then((r) => r.data.data),

  setLineup: (eventId: string, teamId: string, lineup: { userId: string; position: number }[]) =>
    api.put(ENDPOINTS.matches.setLineup, { eventId, teamId, lineup }).then((r) => r.data.data),

  autoGenerateLineup: (eventId: string, teamId: string) =>
    api.post(ENDPOINTS.matches.autoLineup(eventId), { teamId }).then((r) => r.data.data),
};
