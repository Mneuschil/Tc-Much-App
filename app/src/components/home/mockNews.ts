/**
 * Mock news items for UI development — remove once real data is available.
 */
import type { NewsItem, NewsComment } from './newsTypes';

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

const COMMENTS_SAISON: NewsComment[] = [
  {
    id: 'c1',
    author: { firstName: 'Lisa', lastName: 'Schmidt' },
    content: 'Super, freu mich schon! Bringe Nudelsalat mit.',
    createdAt: hoursAgo(1),
  },
  {
    id: 'c2',
    author: { firstName: 'Jan', lastName: 'Hoffmann' },
    content: 'Wird das Turnier am Samstag parallel laufen oder erst danach Grillen?',
    createdAt: hoursAgo(1.5),
  },
  {
    id: 'c3',
    author: { firstName: 'Thomas', lastName: 'Müller' },
    content: '@Jan Erst ab 18 Uhr, die Clubmeisterschaft läuft tagsüber.',
    createdAt: hoursAgo(0.5),
  },
];

const COMMENTS_MEDEN: NewsComment[] = [
  {
    id: 'c4',
    author: { firstName: 'Markus', lastName: 'Klein' },
    content: 'Herren 30 Aufstellung ist schon drin!',
    createdAt: hoursAgo(12),
  },
];

export const MOCK_NEWS: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Saisoneröffnung 2026',
    content:
      'Liebe Mitglieder, am Samstag starten wir offiziell in die neue Sommersaison! Ab 10 Uhr sind alle Plätze geöffnet, ab 18 Uhr laden wir zum gemeinsamen Grillen am Clubhaus ein. Bringt gerne Salate und gute Laune mit!\n\nDie Clubmeisterschaft Einzel findet parallel von 10–18 Uhr statt. Meldet euch bitte bis Donnerstag über die App an.\n\nWir freuen uns auf einen großartigen Start in die Saison!',
    imageUrl: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80',
    author: { firstName: 'Thomas', lastName: 'Müller' },
    createdAt: hoursAgo(2),
    likes: 24,
    comments: COMMENTS_SAISON,
    isLiked: false,
  },
  {
    id: 'news-2',
    title: 'Medenrunde: Aufstellungen melden',
    content:
      'Die Mannschaftsführer werden gebeten, bis Freitag die Aufstellungen für den ersten Spieltag einzureichen. Bitte Verfügbarkeiten in der App eintragen.\n\nBei Fragen zur Aufstellung wendet euch an euren Mannschaftsführer oder den Sportwart.',
    imageUrl: null,
    author: { firstName: 'Stefan', lastName: 'Weber' },
    createdAt: hoursAgo(18),
    likes: 12,
    comments: COMMENTS_MEDEN,
    isLiked: true,
  },
  {
    id: 'news-3',
    title: 'Platz 4 gesperrt',
    content:
      'Wegen Sanierungsarbeiten ist Platz 4 bis einschließlich nächsten Mittwoch gesperrt. Bitte auf die anderen Plätze ausweichen.\n\nDie Arbeiten betreffen den Belag und die Linierung. Plätze 1–3 und 5–6 sind uneingeschränkt nutzbar.',
    imageUrl: null,
    author: { firstName: 'Klaus', lastName: 'Becker' },
    createdAt: hoursAgo(42),
    likes: 5,
    comments: [],
    isLiked: false,
  },
];

export function getNewsById(id: string): NewsItem | undefined {
  return MOCK_NEWS.find((n) => n.id === id);
}
