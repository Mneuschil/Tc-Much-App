import api from '../../../lib/api';

export const rankingService = {
  getRankings: () =>
    api.get('/rankings').then(r => r.data.data),

  initializeRanking: (input: Record<string, unknown>) =>
    api.post('/rankings/init', input).then(r => r.data.data),

  getMatchHistory: (userId: string) =>
    api.get(`/rankings/${userId}/history`).then(r => r.data.data),
};
