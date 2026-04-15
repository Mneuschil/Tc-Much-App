import { renderHook } from '@testing-library/react-native';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';

// Track focus callbacks
const focusCallbacks: (() => void)[] = [];

jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  useFocusEffect: (callback: () => void) => {
    focusCallbacks.push(callback);
    callback();
  },
}));

describe('useRefreshOnFocus', () => {
  beforeEach(() => {
    focusCallbacks.length = 0;
  });

  it('does not call refetch on first mount', () => {
    const refetch = jest.fn();
    renderHook(() => useRefreshOnFocus(refetch));
    expect(refetch).not.toHaveBeenCalled();
  });
});
