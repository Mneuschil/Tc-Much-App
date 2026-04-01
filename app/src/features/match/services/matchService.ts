import api from '../../../lib/api';
import type { TennisSet } from '@tennis-club/shared';

export const matchService = {
  submitResult: (matchId: string, input: { sets: TennisSet[]; winnerId: string }) =>
    api.post(`/matches/${matchId}/result`, input).then(r => r.data.data),

  confirmResult: (matchId: string) =>
    api.post(`/matches/${matchId}/result/confirm`).then(r => r.data.data),

  rejectResult: (matchId: string, rejectionReason: string, correctedSets?: TennisSet[], correctedWinnerId?: string) =>
    api.post(`/matches/${matchId}/result/reject`, { rejectionReason, correctedSets, correctedWinnerId }).then(r => r.data.data),

  resolveDispute: (matchId: string, sets: TennisSet[], winnerId: string) =>
    api.post(`/matches/${matchId}/result/resolve`, { sets, winnerId }).then(r => r.data.data),

  getResultsForEvent: (eventId: string) =>
    api.get(`/matches/results/event/${eventId}`).then(r => r.data.data),
};
