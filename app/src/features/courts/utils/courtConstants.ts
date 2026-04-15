import type { CourtCategory } from '../services/courtsService';

export const COURT_COUNT = 5;
export const COURTS = [1, 2, 3, 4, 5] as const;
export const HOUR_START = 8;
export const HOUR_END = 22;
export const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
export const HOUR_HEIGHT = 56;

export const CATEGORY_LABEL: Record<CourtCategory, string> = {
  TRAINING: 'Training',
  MATCH: 'Match',
  RANKING: 'Rangliste',
  OTHER: 'Sonstiges',
};

export interface CategoryStyle {
  bg: string;
  text: string;
  border: string;
}

export function getCategoryStyle(
  category: CourtCategory,
  colors: {
    accentSurface: string;
    accent: string;
    successSurface: string;
    success: string;
    warningSurface: string;
    warning: string;
    backgroundTertiary: string;
    textSecondary: string;
    textPrimary: string;
  },
): CategoryStyle {
  switch (category) {
    case 'TRAINING':
      return { bg: colors.accentSurface, text: colors.accent, border: colors.accent };
    case 'MATCH':
      return { bg: colors.warningSurface, text: colors.warning, border: colors.warning };
    case 'RANKING':
      return { bg: colors.successSurface, text: colors.success, border: colors.success };
    case 'OTHER':
    default:
      return {
        bg: colors.backgroundTertiary,
        text: colors.textPrimary,
        border: colors.textSecondary,
      };
  }
}
