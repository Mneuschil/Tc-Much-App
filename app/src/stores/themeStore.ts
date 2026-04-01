import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../lib/constants';

interface ClubColors {
  primaryColor: string;
  secondaryColor: string;
}

interface ThemeState {
  clubColors: ClubColors;
  isDarkMode: boolean;
  setClubTheme: (colors: ClubColors) => void;
  setDarkMode: (isDark: boolean) => void;
  initTheme: (systemIsDark: boolean) => Promise<void>;
}

const DEFAULT_COLORS: ClubColors = {
  primaryColor: '#1B4F72',
  secondaryColor: '#2E86C1',
};

export const useThemeStore = create<ThemeState>((set) => ({
  clubColors: DEFAULT_COLORS,
  isDarkMode: false,

  setClubTheme: (colors: ClubColors) => {
    set({ clubColors: colors });
  },

  setDarkMode: (isDark: boolean) => {
    set({ isDarkMode: isDark });
    AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, isDark ? 'dark' : 'light');
  },

  initTheme: async (systemIsDark: boolean) => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);
      if (stored) {
        set({ isDarkMode: stored === 'dark' });
      } else {
        set({ isDarkMode: systemIsDark });
      }
    } catch {
      set({ isDarkMode: systemIsDark });
    }
  },
}));
