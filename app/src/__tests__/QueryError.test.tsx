import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QueryError } from '../components/ui/QueryError';

// Mock theme
jest.mock('../theme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#1A1A1A',
      textSecondary: '#8E8E93',
      textTertiary: '#C4C4C6',
      backgroundSecondary: '#F5F6F7',
    },
    typography: {
      h4: { fontSize: 18, fontWeight: '600' },
      body: { fontSize: 16 },
      bodyMedium: { fontSize: 16, fontWeight: '500' },
    },
    spacing: { sm: 8, lg: 16, xl: 20 },
    radii: { lg: 16 },
    borderRadius: { lg: 16 },
  }),
}));

describe('QueryError', () => {
  it('renders with default error message', () => {
    const { getByText } = render(<QueryError />);

    expect(getByText('Fehler beim Laden')).toBeTruthy();
    expect(getByText('Daten konnten nicht geladen werden. Bitte versuche es erneut.')).toBeTruthy();
  });

  it('renders with custom message', () => {
    const { getByText } = render(<QueryError message="Netzwerkfehler" />);

    expect(getByText('Netzwerkfehler')).toBeTruthy();
  });

  it('renders retry button when onRetry is provided', () => {
    const mockRetry = jest.fn();
    const { getByText } = render(<QueryError onRetry={mockRetry} />);

    const retryButton = getByText('Erneut versuchen');
    expect(retryButton).toBeTruthy();

    fireEvent.press(retryButton);
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render retry button when onRetry is not provided', () => {
    const { queryByText } = render(<QueryError />);

    expect(queryByText('Erneut versuchen')).toBeNull();
  });
});
