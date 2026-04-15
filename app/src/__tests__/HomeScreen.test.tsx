import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../../app/(tabs)/home';

jest.mock('../theme', () => require('./__mocks__/theme'));

jest.mock('../stores/authStore', () => ({
  useAuthStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      user: { id: 'u1', firstName: 'Max', lastName: 'Muster', email: 'max@test.de' },
      isAuthenticated: true,
    }),
}));

jest.mock('../hooks/usePermissions', () => ({
  usePermissions: () => ({ hasAnyRole: () => false, isBoard: false, isAdmin: false }),
}));

jest.mock('../features/calendar/hooks/useEvents', () => ({
  useWeekEvents: () => ({ data: [], refetch: jest.fn() }),
}));

jest.mock('../features/todo/hooks/useTodos', () => ({
  useTodos: () => ({ data: [], refetch: jest.fn() }),
}));

jest.mock('../features/notifications/hooks/useNotifications', () => ({
  useNotifications: () => ({ data: [] }),
}));

jest.mock('../components/home/mockNews', () => ({
  MOCK_NEWS: [],
}));

jest.mock('../hooks/useRefreshOnFocus', () => ({
  useRefreshOnFocus: jest.fn(),
}));

// Mock heavy sub-components that depend on native modules
jest.mock('../components/home/HeroHeader', () => ({
  HeroHeader: () => null,
}));

jest.mock('../components/home/RecentResults', () => ({
  RecentResults: () => null,
}));

jest.mock('../components/home/NewsFeed', () => ({
  NewsFeed: () => null,
}));

describe('HomeScreen', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<HomeScreen />);
    expect(toJSON()).toBeTruthy();
  });
});
