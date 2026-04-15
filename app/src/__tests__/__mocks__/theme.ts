/**
 * Shared theme mock for tests.
 * Usage: jest.mock('../../theme', () => require('./__mocks__/theme'));
 * Or:    jest.mock('../theme', () => require('./__mocks__/theme'));
 */
export const useTheme = () => ({
  colors: {
    background: '#FFFFFF',
    backgroundSecondary: '#F5F6F7',
    backgroundTertiary: '#EEEFEF',
    surface: '#FFFFFF',
    textPrimary: '#1A1A1A',
    textSecondary: '#8E8E93',
    textTertiary: '#C4C4C6',
    textInverse: '#FFFFFF',
    accent: '#023320',
    accentLight: '#0EA65A',
    accentSurface: '#D1F2EC',
    accentSubtle: '#EDF9F6',
    chipActive: '#1A1A1A',
    chipInactive: '#F5F6F7',
    buttonPrimary: '#1A1A1A',
    buttonPrimaryText: '#FFFFFF',
    border: '#E5E5E5',
    success: '#0EA65A',
    danger: '#FF3B30',
    warning: '#FF9500',
    primary: '#023320',
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '700' },
    h2: { fontSize: 24, fontWeight: '700' },
    h3: { fontSize: 20, fontWeight: '600' },
    h4: { fontSize: 18, fontWeight: '600' },
    body: { fontSize: 16 },
    bodyMedium: { fontSize: 16, fontWeight: '500' },
    bodySmall: { fontSize: 14 },
    label: { fontSize: 14, fontWeight: '600' },
    caption: { fontSize: 12 },
    captionMedium: { fontSize: 12, fontWeight: '500' },
    buttonSmall: { fontSize: 14, fontWeight: '600' },
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 },
  radii: { sm: 8, md: 12, lg: 16, xl: 20, full: 999 },
  borderRadius: { sm: 8, md: 12, lg: 16, xl: 20, full: 999 },
  isDark: false,
});
