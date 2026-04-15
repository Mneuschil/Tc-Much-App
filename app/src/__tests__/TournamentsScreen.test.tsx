import React from 'react';
import { render } from '@testing-library/react-native';
import TournamentsScreen from '../../app/(tabs)/tournaments';

jest.mock('../theme', () => require('./__mocks__/theme'));

jest.mock('../features/tournaments/hooks/useTournaments', () => ({
  useTournaments: () => ({ data: [], isLoading: false, refetch: jest.fn() }),
}));

jest.mock('../hooks/useRefreshOnFocus', () => ({
  useRefreshOnFocus: jest.fn(),
}));

describe('TournamentsScreen', () => {
  it('renders with empty state', () => {
    const { getByText } = render(<TournamentsScreen />);
    expect(getByText('Turniere')).toBeTruthy();
  });
});
