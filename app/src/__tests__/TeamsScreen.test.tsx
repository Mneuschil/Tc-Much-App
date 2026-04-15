import React from 'react';
import { render } from '@testing-library/react-native';
import TeamsScreen from '../../app/(tabs)/teams';

jest.mock('../theme', () => require('./__mocks__/theme'));

jest.mock('../features/teams/hooks/useMyTeams', () => ({
  useMyTeams: () => ({
    myTeams: [],
    otherTeams: [],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));

jest.mock('../features/calendar/hooks/useEvents', () => ({
  useWeekEvents: () => ({ data: [] }),
}));

jest.mock('../hooks/useRefreshOnFocus', () => ({
  useRefreshOnFocus: jest.fn(),
}));

describe('TeamsScreen', () => {
  it('renders with empty state when no teams exist', () => {
    const { getByText } = render(<TeamsScreen />);

    expect(getByText('Teams')).toBeTruthy();
    expect(getByText('Keine Teams')).toBeTruthy();
    expect(getByText('Du bist noch in keinem Team Mitglied')).toBeTruthy();
  });
});
