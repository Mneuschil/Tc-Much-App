import api from '../../../lib/api';
import type { TennisSet } from '@tennis-club/shared';

export const matchService = {
  submitResult: (input: any) =>
    api.post('/matches/results', input).then(r => r.data.data),

  confirmResult: (resultId: string) =>
    api.put(`/matches/results/${resultId}/confirm`).then(r => r.data.data),

  rejectResult: (resultId: string, rejectionReason: string, correctedSets?: TennisSet[], correctedWinnerId?: string) =>
    api.put(`/matches/results/${resultId}/reject`, { resultId, rejectionReason, correctedSets, correctedWinnerId }).then(r => r.data.data),

  resolveDispute: (resultId: string, sets: TennisSet[], winnerId: string) =>
    api.put(`/matches/results/${resultId}/resolve`, { resultId, sets, winnerId }).then(r => r.data.data),

  getResultsForEvent: (eventId: string) =>
    api.get(`/matches/results/event/${eventId}`).then(r => r.data.data),
};
