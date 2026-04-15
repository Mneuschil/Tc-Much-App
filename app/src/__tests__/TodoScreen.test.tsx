import React from 'react';
import { renderWithProviders } from './__mocks__/testUtils';
import TodoScreen from '../../app/todo/index';

jest.mock('../theme', () => require('./__mocks__/theme'));

jest.mock('../features/todo/hooks/useTodos', () => ({
  useTodos: () => ({
    data: [],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
  useCreateTodo: () => ({ mutate: jest.fn(), isPending: false }),
  useToggleTodoStatus: () => ({ mutate: jest.fn() }),
  useDeleteTodo: () => ({ mutate: jest.fn() }),
}));

jest.mock('../hooks/usePermissions', () => ({
  usePermissions: () => ({ isBoard: false }),
}));

jest.mock('../hooks/useProfile', () => ({
  useClubMembers: () => ({ data: [] }),
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: (props: Record<string, unknown>) => <View {...props} /> };
});

describe('TodoScreen', () => {
  it('renders with empty state', () => {
    const { getByText } = renderWithProviders(<TodoScreen />);
    expect(getByText('Keine Todos')).toBeTruthy();
    expect(getByText('Alles erledigt')).toBeTruthy();
  });
});
