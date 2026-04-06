import api from '../../../lib/api';
import { ENDPOINTS } from '../../../lib/endpoints';

export const rankingService = {
  getRankings: () => api.get(ENDPOINTS.rankings.list).then((r) => r.data.data),

  initializeRanking: (input: Record<string, unknown>) =>
    api.post(ENDPOINTS.rankings.init, input).then((r) => r.data.data),

  getMatchHistory: (userId: string) =>
    api.get(ENDPOINTS.rankings.history(userId)).then((r) => r.data.data),

  getChallenges: () => api.get(ENDPOINTS.rankings.challenges).then((r) => r.data.data),

  createChallenge: (challengedId: string) =>
    api.post(ENDPOINTS.rankings.challenge, { challengedId }).then((r) => r.data.data),

  respondChallenge: (challengeId: string, action: 'ACCEPT' | 'DECLINE') =>
    api.post(ENDPOINTS.rankings.respondChallenge(challengeId), { action }).then((r) => r.data.data),
};
