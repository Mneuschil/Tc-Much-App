import api from '../../../lib/api';

export const rankingService = {
  getRankings: () =>
    api.get('/rankings').then(r => r.data.data),

  initializeRanking: (input: any) =>
    api.post('/rankings/initialize', input).then(r => r.data.data),

  getMatchHistory: (userId: string) =>
    api.get(`/rankings/history/${userId}`).then(r => r.data.data),
};
