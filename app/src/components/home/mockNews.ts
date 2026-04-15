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
    author: { firstName: 'Lisa', lastName: 'Hoffmann' },
    content: 'Super, freu mich schon! Bringe Nudelsalat mit.',
    createdAt: hoursAgo(1),
  },
  {
    id: 'c2',
    author: { firstName: 'Jan', lastName: 'Mueller' },
    content: 'Wird das Turnier am Samstag parallel laufen oder erst danach Grillen?',
    createdAt: hoursAgo(1.5),
  },
  {
    id: 'c3',
    author: { firstName: 'Thomas', lastName: 'Schmidt' },
    content: '@Jan Erst ab 18 Uhr, die Clubmeisterschaft laeuft tagsueber.',
    createdAt: hoursAgo(0.5),
  },
];

const COMMENTS_MEDEN: NewsComment[] = [
  {
    id: 'c4',
    author: { firstName: 'Peter', lastName: 'Weber' },
    content: 'Herren 1 Aufstellung ist schon drin!',
    createdAt: hoursAgo(12),
  },
  {
    id: 'c5',
    author: { firstName: 'Marco', lastName: 'Becker' },
    content: 'Bin fuer Sonntag verfuegbar, Position 3 oder 4.',
    createdAt: hoursAgo(10),
  },
];

const COMMENTS_JUGEND: NewsComment[] = [
  {
    id: 'c6',
    author: { firstName: 'Sabine', lastName: 'Mueller' },
    content: 'Tolle Initiative! Mein Sohn ist begeistert.',
    createdAt: hoursAgo(4),
  },
  {
    id: 'c7',
    author: { firstName: 'Klaus', lastName: 'Berger' },
    content: 'Wir haben noch 3 Plaetze frei. Schnell anmelden!',
    createdAt: hoursAgo(3),
  },
];

const COMMENTS_PLATZ: NewsComment[] = [
  {
    id: 'c8',
    author: { firstName: 'Stefan', lastName: 'Braun' },
    content: 'Sieht wirklich toll aus! Danke an alle Helfer.',
    createdAt: hoursAgo(6),
  },
];

const COMMENTS_BEZIRKSLIGA: NewsComment[] = [
  {
    id: 'c9',
    author: { firstName: 'Daniel', lastName: 'Koch' },
    content: 'Starke Leistung von der ganzen Mannschaft!',
    createdAt: hoursAgo(2),
  },
  {
    id: 'c10',
    author: { firstName: 'Anna', lastName: 'Wagner' },
    content: 'Glueckwunsch! Weiter so!',
    createdAt: hoursAgo(1),
  },
  {
    id: 'c11',
    author: { firstName: 'Jan', lastName: 'Mueller' },
    content: 'Naechste Woche wird schwerer, aber wir sind bereit.',
    createdAt: hoursAgo(0.5),
  },
];

export const MOCK_NEWS: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Saisoneroeffnung 2026 — Alle sind eingeladen!',
    content:
      'Liebe Mitglieder, am Samstag starten wir offiziell in die neue Sommersaison! Ab 10 Uhr sind alle Plaetze geoeffnet, ab 18 Uhr laden wir zum gemeinsamen Grillen am Clubhaus ein. Bringt gerne Salate und gute Laune mit!\n\nDie Clubmeisterschaft Einzel findet parallel von 10-18 Uhr statt. Meldet euch bitte bis Donnerstag ueber die App an.\n\nWir freuen uns auf einen grossartigen Start in die Saison!',
    imageUrl: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80',
    author: { firstName: 'Max', lastName: 'Mustermann' },
    createdAt: hoursAgo(2),
    likes: 31,
    comments: COMMENTS_SAISON,
    isLiked: false,
  },
  {
    id: 'news-2',
    title: 'Herren 1 gewinnt Bezirksliga-Auftakt 5:4!',
    content:
      'Was fuer ein Krimi! Unsere Herren 1 haben den Saisonauftakt gegen TC Overath mit 5:4 gewonnen. Nach den Einzeln stand es 3:3 — in den Doppeln haben Jan Mueller und Peter Weber den entscheidenden Punkt geholt.\n\nNaechste Woche geht es auswaerts gegen TC Eitorf. Drueckt die Daumen!',
    imageUrl: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80',
    author: { firstName: 'Thomas', lastName: 'Schmidt' },
    createdAt: hoursAgo(8),
    likes: 42,
    comments: COMMENTS_BEZIRKSLIGA,
    isLiked: true,
  },
  {
    id: 'news-3',
    title: 'Jugend-Sommercamp: Jetzt anmelden!',
    content:
      'Vom 14.-18. Juli findet unser Jugend-Sommercamp statt! 5 Tage Tennis, Spiel und Spass fuer Kids von 6-14 Jahren. Taegliches Training mit unseren Trainern, Mittagessen inklusive.\n\nKosten: 149 EUR fuer Mitglieder, 189 EUR fuer Nicht-Mitglieder.\n\nAnmeldung ab sofort ueber die App oder per Mail an trainer@tcmuch.de. Begrenzt auf 24 Plaetze!',
    imageUrl: 'https://images.unsplash.com/photo-1551773188-d04f68e4b5e4?w=800&q=80',
    author: { firstName: 'Klaus', lastName: 'Berger' },
    createdAt: hoursAgo(18),
    likes: 27,
    comments: COMMENTS_JUGEND,
    isLiked: false,
  },
  {
    id: 'news-4',
    title: 'Platzsanierung abgeschlossen — Ergebnis kann sich sehen lassen!',
    content:
      'Die Sanierung von Platz 3 und 4 ist abgeschlossen! Neuer Sandbelag, frische Linierung und reparierte Netze. Ein grosses Dankeschoen an alle freiwilligen Helfer, die am Wochenende mit angepackt haben.\n\nAlle 6 Plaetze sind ab sofort wieder uneingeschraenkt bespielbar.',
    imageUrl: 'https://images.unsplash.com/photo-1512412046876-f386342eddb3?w=800&q=80',
    author: { firstName: 'Max', lastName: 'Mustermann' },
    createdAt: hoursAgo(36),
    likes: 18,
    comments: COMMENTS_PLATZ,
    isLiked: false,
  },
  {
    id: 'news-5',
    title: 'Medenrunde: Aufstellungen bis Freitag melden',
    content:
      'Die Mannschaftsfuehrer werden gebeten, bis Freitag die Aufstellungen fuer den naechsten Spieltag einzureichen. Bitte Verfuegbarkeiten in der App eintragen.\n\nBetrifft: Herren 1, Herren 2, Damen 1.\n\nBei Fragen zur Aufstellung wendet euch an euren Mannschaftsfuehrer oder den Sportwart.',
    imageUrl: null,
    author: { firstName: 'Thomas', lastName: 'Schmidt' },
    createdAt: hoursAgo(48),
    likes: 12,
    comments: COMMENTS_MEDEN,
    isLiked: true,
  },
  {
    id: 'news-6',
    title: 'Neue Trainingszeiten ab Mai',
    content:
      'Ab Mai gelten die Sommer-Trainingszeiten:\n\n- Di 18-20 Uhr: Erwachsene Anfaenger/Fortgeschrittene\n- Do 18-20 Uhr: Erwachsene Leistungsgruppe\n- Sa 10-12 Uhr: Jugend\n- So 10-12 Uhr: Freies Spiel mit Trainer\n\nAnmeldung jeweils ueber die App. Maximal 8 Teilnehmer pro Einheit.',
    imageUrl: null,
    author: { firstName: 'Klaus', lastName: 'Berger' },
    createdAt: hoursAgo(72),
    likes: 15,
    comments: [],
    isLiked: false,
  },
];

export function getNewsById(id: string): NewsItem | undefined {
  return MOCK_NEWS.find((n) => n.id === id);
}
