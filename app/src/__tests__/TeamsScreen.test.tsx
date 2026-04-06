import React from 'react';
import { render } from '@testing-library/react-native';
import TeamsScreen from '../../app/(tabs)/teams';

// Mock hooks
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
  useWeekEvents: () => ({
    data: [],
  }),
}));

// Mock theme
jest.mock('../theme', () => ({
  useTheme: () => ({
    colors: {
      background: '#FFFFFF',
      backgroundSecondary: '#F5F6F7',
      surface: '#FFFFFF',
      textPrimary: '#1A1A1A',
      textSecondary: '#8E8E93',
      textTertiary: '#C4C4C6',
      textInverse: '#FFFFFF',
      accent: '#023320',
      accentLight: '#0EA65A',
      chipActive: '#1A1A1A',
      chipInactive: '#F5F6F7',
      buttonPrimary: '#1A1A1A',
      buttonPrimaryText: '#FFFFFF',
      border: '#E5E5E5',
    },
    typography: {
      h1: { fontSize: 32, fontWeight: '700' },
      h3: { fontSize: 20, fontWeight: '600' },
      body: { fontSize: 16 },
      bodyMedium: { fontSize: 16, fontWeight: '500' },
      caption: { fontSize: 12 },
      captionMedium: { fontSize: 12, fontWeight: '500' },
    },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 },
    radii: { sm: 8, md: 12, lg: 16, xl: 20, full: 999 },
    borderRadius: { sm: 8, md: 12, lg: 16, xl: 20, full: 999 },
  }),
}));

describe('TeamsScreen', () => {
  it('renders with empty state when no teams exist', () => {
    const { getByText } = render(<TeamsScreen />);

    expect(getByText('Teams')).toBeTruthy();
    expect(getByText('Keine Teams')).toBeTruthy();
    expect(getByText('Keine Teams angelegt')).toBeTruthy();
  });

  it('renders filter pills', () => {
    const { getByText } = render(<TeamsScreen />);

    expect(getByText('Alle')).toBeTruthy();
    expect(getByText('Mannschaften')).toBeTruthy();
    expect(getByText('Training')).toBeTruthy();
    expect(getByText('Vorstand')).toBeTruthy();
  });
});
