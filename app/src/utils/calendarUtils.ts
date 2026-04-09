import { isSameDay as dateFnsIsSameDay, getISOWeek } from 'date-fns';
import type { ColorTokens } from '../theme/colors';

/**
 * Base event shape for calendar UI components.
 * Keeps `type` as string since the API returns plain strings, not enum values.
 * Components can extend this with additional fields (e.g. `team`, `court`).
 */
export interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
  location: string | null;
  court: string | null;
  isHomeGame: boolean | null;
  teamId: string | null;
}

/**
 * Returns an array of 7 dates for the week containing baseDate,
 * starting on Monday (ISO 8601 / European standard).
 */
export function getWeekDays(baseDate: Date): Date[] {
  const day = baseDate.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/**
 * Converts a Date or ISO string to a YYYY-MM-DD key using LOCAL time.
 * Important: uses local timezone, not UTC, to avoid off-by-one errors
 * for dates near midnight.
 */
export function toDateKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Re-export date-fns isSameDay for convenience. */
export const isSameDay = dateFnsIsSameDay;

/** Returns ISO 8601 week number (KW) for a given date. */
export function getCalendarWeek(date: Date): number {
  return getISOWeek(date);
}

/** German day labels starting Monday. */
export const DAY_LABELS_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const;

/** German month names. */
export const MONTH_NAMES_DE = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
] as const;

/**
 * Returns a consistent color for a given event type.
 * Single source of truth for event color-coding across the app.
 */
export function getEventColor(
  type: string,
  colors: Pick<
    ColorTokens,
    'danger' | 'accent' | 'accentLight' | 'warning' | 'info' | 'textSecondary'
  >,
): string {
  switch (type) {
    case 'LEAGUE_MATCH':
    case 'CUP_MATCH':
      return colors.danger;
    case 'TOURNAMENT':
    case 'CLUB_CHAMPIONSHIP':
      return colors.accent;
    case 'RANKING_MATCH':
      return colors.warning;
    case 'TRAINING':
      return colors.accentLight;
    case 'CLUB_EVENT':
      return colors.info;
    default:
      return colors.textSecondary;
  }
}
