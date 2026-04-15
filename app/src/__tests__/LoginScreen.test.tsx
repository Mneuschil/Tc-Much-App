import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../../app/(auth)/login';

// Mock useAuth hook
const mockLogin = jest.fn();
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: mockLogin,
    logout: jest.fn(),
  }),
}));

// Mock theme
jest.mock('../theme', () => ({
  useTheme: () => ({
    colors: {
      background: '#FFFFFF',
      backgroundSecondary: '#F5F6F7',
      textPrimary: '#1A1A1A',
      textSecondary: '#8E8E93',
      accent: '#023320',
      buttonPrimary: '#1A1A1A',
      buttonPrimaryText: '#FFFFFF',
      border: '#E5E5E5',
      textInverse: '#FFFFFF',
      accentLight: '#0EA65A',
    },
    typography: {
      h2: { fontSize: 24, fontWeight: '700' },
      body: { fontSize: 16 },
      bodySmall: { fontSize: 14 },
    },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 },
    radii: { sm: 8, md: 12, lg: 16 },
    borderRadius: { sm: 8, md: 12, lg: 16 },
  }),
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the login form', () => {
    const { getAllByText, getByPlaceholderText } = render(<LoginScreen />);

    expect(getAllByText('Anmelden').length).toBeGreaterThanOrEqual(1);
    expect(getByPlaceholderText('deine@email.de')).toBeTruthy();
    expect(getByPlaceholderText('Passwort')).toBeTruthy();
  });

  it('shows validation alert when fields are empty', () => {
    const { getAllByText } = render(<LoginScreen />);

    // The "Anmelden" text appears both as heading and as button label
    const buttons = getAllByText('Anmelden');
    // The button is the one inside the Pressable - fire press on last one
    fireEvent.press(buttons[buttons.length - 1]);

    // login should not be called with empty fields
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login with trimmed email, password and clubCode', async () => {
    mockLogin.mockResolvedValue(undefined);

    const { getByPlaceholderText, getAllByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('z.B. TCM026'), 'tcm026');
    fireEvent.changeText(getByPlaceholderText('deine@email.de'), ' Test@Email.De ');
    fireEvent.changeText(getByPlaceholderText('Passwort'), 'password123');

    const buttons = getAllByText('Anmelden');
    fireEvent.press(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@email.de',
        password: 'password123',
        clubCode: 'TCM026',
      });
    });
  });
});
