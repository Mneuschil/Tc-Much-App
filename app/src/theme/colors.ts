// Design System – Light & Dark Color Tokens

export const lightColors = {
  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F5F6F7',
  backgroundTertiary: '#EEEFEF',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#8E8E93',
  textTertiary: '#C4C4C6',
  textInverse: '#FFFFFF',

  // Accent (Vereinsgrün)
  accent: '#023320',
  accentLight: '#0EA65A',
  accentSurface: '#D1F2EC',
  accentSubtle: '#EDF9F6',

  // Buttons
  buttonPrimary: '#1A1A1A',
  buttonPrimaryText: '#FFFFFF',

  // Status
  success: '#0EA65A',
  successSurface: '#EDF9F6',
  danger: '#FF3B30',
  dangerSurface: '#FFEBEB',
  warning: '#FF9500',
  warningSurface: '#FFF4E5',
  info: '#007AFF',

  // Borders
  border: '#D1D1D6',
  borderLight: '#E5E5EA',
  separator: '#E5E5EA',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.4)',

  // Semantic aliases (used by existing screens)
  surface: '#F5F6F7',
  surfaceVariant: '#EDF9F6',
  cardBackground: '#FFFFFF',
  inputBackground: '#F5F6F7',
  primary: '#0EA65A',
  primaryDark: '#023320',
  primaryLight: '#0EA65A',
  highlight: '#D1F2EC',
  chipActive: '#1A1A1A',
  chipInactive: '#F5F6F7',
  tabBarBackground: '#FFFFFF',
  tabBarInactive: '#C4C4C6',
} as const;

export const darkColors = {
  // Backgrounds
  background: '#0A0A0A',
  backgroundSecondary: '#1C1C1E',
  backgroundTertiary: '#2C2C2E',

  // Text
  textPrimary: '#F5F5F7',
  textSecondary: '#8E8E93',
  textTertiary: '#48484A',
  textInverse: '#0A0A0A',

  // Accent
  accent: '#0EA65A',
  accentLight: '#34D058',
  accentSurface: '#0A2E1A',
  accentSubtle: '#0F1F16',

  // Buttons
  buttonPrimary: '#F5F5F7',
  buttonPrimaryText: '#0A0A0A',

  // Status
  success: '#34D058',
  successSurface: '#0F1F16',
  danger: '#FF453A',
  dangerSurface: '#3A1A1A',
  warning: '#FFD60A',
  warningSurface: '#3A2E0A',
  info: '#0A84FF',

  // Borders
  border: '#38383A',
  borderLight: '#2C2C2E',
  separator: '#38383A',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.6)',

  // Semantic aliases (used by existing screens)
  surface: '#1C1C1E',
  surfaceVariant: '#0F1F16',
  cardBackground: '#1C1C1E',
  inputBackground: '#2C2C2E',
  primary: '#34D058',
  primaryDark: '#0EA65A',
  primaryLight: '#34D058',
  highlight: '#0A2E1A',
  chipActive: '#F5F5F7',
  chipInactive: '#1C1C1E',
  tabBarBackground: '#0A0A0A',
  tabBarInactive: '#48484A',
} as const;

// Use mutable type so dark/light variants are assignable
export type ColorTokens = { [K in keyof typeof lightColors]: string };
