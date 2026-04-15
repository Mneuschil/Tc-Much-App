import React from 'react';
import { renderWithProviders } from './__mocks__/testUtils';
import RankingScreen from '../../app/ranking/index';

jest.mock('../theme', () => require('./__mocks__/theme'));

jest.mock('../features/ranking/hooks/useRanking', () => ({
  useRankings: () => ({
    data: [],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
  useMatchHistory: () => ({ data: [] }),
  useMyChallenges: () => ({ data: [] }),
  useInitializeRanking: () => ({ mutate: jest.fn() }),
  useCreateChallenge: () => ({ mutate: jest.fn() }),
  useRespondChallenge: () => ({ mutate: jest.fn() }),
}));

jest.mock('../stores/authStore', () => {
  const state = { user: { id: 'u1' }, isAuthenticated: true };
  const useAuthStore = (selectorOrUndefined?: (s: Record<string, unknown>) => unknown) =>
    typeof selectorOrUndefined === 'function' ? selectorOrUndefined(state) : state;
  useAuthStore.getState = () => state;
  return { useAuthStore };
});

describe('RankingScreen', () => {
  it('renders empty state', () => {
    const { getByText } = renderWithProviders(<RankingScreen />);
    expect(getByText('Keine Rangliste')).toBeTruthy();
  });
});
