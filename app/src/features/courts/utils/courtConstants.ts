import type { CourtCategory, TrainingType } from '../services/courtsService';

export const COURT_COUNT = 5;
export const COURTS = [1, 2, 3, 4, 5] as const;
export const HOUR_START = 8;
export const HOUR_END = 22;
export const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
export const HOUR_HEIGHT = 56;

export const CATEGORY_LABEL: Record<CourtCategory, string> = {
  TRAINING: 'Training',
  MEDENSPIEL: 'Medenspiel',
  CLUB_EVENT: 'Vereinsevent',
  OTHER: 'Sonstiges',
};

export const TRAINING_TYPE_LABEL: Record<TrainingType, string> = {
  MANNSCHAFTSTRAINING: 'Mannschaftstraining',
  JUGENDTRAINING: 'Jugendtraining',
  SCHNUPPERSTUNDE: 'Schnupperstunde',
  PRIVATGRUPPE: 'Privatgruppe',
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
    case 'MEDENSPIEL':
      return { bg: colors.warningSurface, text: colors.warning, border: colors.warning };
    case 'CLUB_EVENT':
    case 'OTHER':
    default:
      return {
        bg: colors.backgroundTertiary,
        text: colors.textPrimary,
        border: colors.textSecondary,
      };
  }
}
