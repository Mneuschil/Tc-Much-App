import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from 'date-fns';
import { de } from 'date-fns/locale';

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd.MM.yyyy HH:mm', { locale: de });
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd.MM.yyyy', { locale: de });
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), 'HH:mm', { locale: de });
}

export function formatRelative(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return `Heute, ${formatTime(d)}`;
  if (isTomorrow(d)) return `Morgen, ${formatTime(d)}`;
  if (isYesterday(d)) return `Gestern, ${formatTime(d)}`;
  return formatDateTime(d);
}

export function formatTimeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: de });
}

export function formatChatDate(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return 'Heute';
  if (isYesterday(d)) return 'Gestern';
  return format(d, 'd. MMMM yyyy', { locale: de });
}
