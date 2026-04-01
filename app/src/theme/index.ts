import { useColorScheme } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { lightColors, darkColors, type ColorTokens } from './colors';
import { typography, type Typography } from './typography';
import { spacing, radii, borderRadius, shadows, type Spacing, type Radii, type BorderRadius } from './spacing';

export interface Theme {
  colors: ColorTokens;
  typography: Typography;
  spacing: Spacing;
  radii: Radii;
  borderRadius: BorderRadius;
  shadows: typeof shadows;
  isDark: boolean;
}

export function useTheme(): Theme {
  const systemScheme = useColorScheme();
  const { isDarkMode, clubColors } = useThemeStore();

  // Follow system setting, themeStore can override
  const isDark = isDarkMode ?? (systemScheme === 'dark');
  const baseColors = isDark ? darkColors : lightColors;

  // Merge club colors as accent overrides if loaded
  const colors: ColorTokens = clubColors.primaryColor !== '#1B4F72'
    ? {
        ...baseColors,
        accent: clubColors.primaryColor,
        accentLight: clubColors.secondaryColor,
      }
    : baseColors;

  return {
    colors,
    typography,
    spacing,
    radii,
    borderRadius,
    shadows,
    isDark,
  };
}

export { lightColors, darkColors } from './colors';
export type { ColorTokens } from './colors';
export { typography } from './typography';
export { spacing, radii, borderRadius, shadows } from './spacing';
