import React from 'react';
import { renderWithProviders } from './__mocks__/testUtils';
import CalendarScreen from '../../app/(tabs)/calendar';

jest.mock('../theme', () => require('./__mocks__/theme'));

jest.mock('../hooks/usePermissions', () => ({
  usePermissions: () => ({ isBoard: false, isAdmin: false }),
}));

jest.mock('../features/calendar/hooks/useEvents', () => ({
  useEvents: () => ({ data: [], isLoading: false, isError: false, refetch: jest.fn() }),
  useCreateEvent: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock('../features/training/hooks/useTraining', () => ({
  useTrainingAttendance: () => ({ data: [] }),
}));

jest.mock('../hooks/useRefreshOnFocus', () => ({
  useRefreshOnFocus: jest.fn(),
}));

jest.mock('react-native-calendars', () => {
  const { View } = require('react-native');
  return { Calendar: (props: { children?: React.ReactNode }) => <View {...props} /> };
});

jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: (props: Record<string, unknown>) => <View {...props} /> };
});

describe('CalendarScreen', () => {
  it('renders without crashing', () => {
    const { getByText } = renderWithProviders(<CalendarScreen />);
    expect(getByText('Kalender')).toBeTruthy();
  });
});
