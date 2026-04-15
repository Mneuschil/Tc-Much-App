import React from 'react';
import { render } from '@testing-library/react-native';
import ChannelsScreen from '../../app/(tabs)/channels';

jest.mock('../theme', () => require('./__mocks__/theme'));

jest.mock('../features/chat/hooks/useChannels', () => ({
  useChannels: () => ({ data: [], isLoading: false, isError: false, refetch: jest.fn() }),
  useCreateChannel: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock('../hooks/usePermissions', () => ({
  usePermissions: () => ({ isBoard: false, isAdmin: false }),
}));

jest.mock('../hooks/useRefreshOnFocus', () => ({
  useRefreshOnFocus: jest.fn(),
}));

describe('ChannelsScreen', () => {
  it('renders with empty state', () => {
    const { getByText } = render(<ChannelsScreen />);
    expect(getByText('Chats')).toBeTruthy();
  });
});
