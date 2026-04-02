/**
 * Mock match results for UI development — remove once real data is available.
 */
import type { RecentResult } from './RecentResults';

function daysAgo(d: number, hour = 14): string {
  const date = new Date();
  date.setDate(date.getDate() - d);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

export const MOCK_RESULTS: RecentResult[] = [
  {
    id: 'res-1',
    type: 'LEAGUE_MATCH',
    title: 'Herren 30 vs. TC Rösrath',
    team1: 'TC Much',
    team2: 'TC Rösrath',
    player1: { firstName: 'TC', lastName: 'Much' },
    player2: { firstName: 'TC', lastName: 'Rösrath' },
    sets: [],
    winnerId: 'player1',
    isHomeGame: true,
    playedAt: daysAgo(0, 16),
    matches: [
      {
        position: 1,
        player1: { firstName: 'Marius', lastName: 'Becker' },
        player2: { firstName: 'Jens', lastName: 'Hartmann' },
        sets: [
          { games1: 6, games2: 4, tiebreak1: null, tiebreak2: null },
          { games1: 6, games2: 3, tiebreak1: null, tiebreak2: null },
        ],
        winnerId: 'player1',
      },
      {
        position: 2,
        player1: { firstName: 'Stefan', lastName: 'Weber' },
        player2: { firstName: 'Kai', lastName: 'Neumann' },
        sets: [
          { games1: 7, games2: 6, tiebreak1: 7, tiebreak2: 4 },
          { games1: 6, games2: 4, tiebreak1: null, tiebreak2: null },
        ],
        winnerId: 'player1',
      },
      {
        position: 3,
        player1: { firstName: 'Thomas', lastName: 'Müller' },
        player2: { firstName: 'Dirk', lastName: 'Scholz' },
        sets: [
          { games1: 3, games2: 6, tiebreak1: null, tiebreak2: null },
          { games1: 6, games2: 7, tiebreak1: 3, tiebreak2: 7 },
        ],
        winnerId: 'player2',
      },
      {
        position: 4,
        player1: { firstName: 'Klaus', lastName: 'Schmidt' },
        player2: { firstName: 'Ralf', lastName: 'Peters' },
        sets: [
          { games1: 6, games2: 2, tiebreak1: null, tiebreak2: null },
          { games1: 6, games2: 1, tiebreak1: null, tiebreak2: null },
        ],
        winnerId: 'player1',
      },
      {
        position: 5,
        player1: { firstName: 'Jan', lastName: 'Richter' },
        player2: { firstName: 'Uwe', lastName: 'Lang' },
        sets: [
          { games1: 6, games2: 4, tiebreak1: null, tiebreak2: null },
          { games1: 4, games2: 6, tiebreak1: null, tiebreak2: null },
          { games1: 10, games2: 7, tiebreak1: null, tiebreak2: null },
        ],
        winnerId: 'player1',
      },
      {
        position: 6,
        player1: { firstName: 'Markus', lastName: 'Klein' },
        player2: { firstName: 'Frank', lastName: 'Braun' },
        sets: [
          { games1: 6, games2: 4, tiebreak1: null, tiebreak2: null },
          { games1: 6, games2: 4, tiebreak1: null, tiebreak2: null },
        ],
        winnerId: 'player1',
      },
    ],
  },
  {
    id: 'res-2',
    type: 'RANKING_MATCH',
    title: 'Ranglistenspiel',
    team1: null,
    team2: null,
    player1: { firstName: 'Stefan', lastName: 'Weber' },
    player2: { firstName: 'Thomas', lastName: 'Müller' },
    sets: [
      { games1: 3, games2: 6, tiebreak1: null, tiebreak2: null },
      { games1: 6, games2: 3, tiebreak1: null, tiebreak2: null },
      { games1: 4, games2: 6, tiebreak1: null, tiebreak2: null },
    ],
    winnerId: 'player2',
    isHomeGame: null,
    playedAt: daysAgo(1, 18),
    matches: [],
  },
  {
    id: 'res-3',
    type: 'CLUB_CHAMPIONSHIP',
    title: 'Clubmeisterschaft Einzel – Halbfinale',
    team1: null,
    team2: null,
    player1: { firstName: 'Klaus', lastName: 'Schmidt' },
    player2: { firstName: 'Markus', lastName: 'Klein' },
    sets: [
      { games1: 6, games2: 2, tiebreak1: null, tiebreak2: null },
      { games1: 6, games2: 1, tiebreak1: null, tiebreak2: null },
    ],
    winnerId: 'player1',
    isHomeGame: null,
    playedAt: daysAgo(2, 11),
    matches: [],
  },
  {
    id: 'res-4',
    type: 'CUP_MATCH',
    title: 'Damen 40 vs. TC Bergheim',
    team1: 'TC Much',
    team2: 'TC Bergheim',
    player1: { firstName: 'TC', lastName: 'Much' },
    player2: { firstName: 'TC', lastName: 'Bergheim' },
    sets: [],
    winnerId: 'player2',
    isHomeGame: false,
    playedAt: daysAgo(3, 16),
    matches: [
      {
        position: 1,
        player1: { firstName: 'Lisa', lastName: 'Hoffmann' },
        player2: { firstName: 'Anna', lastName: 'Kraus' },
        sets: [
          { games1: 4, games2: 6, tiebreak1: null, tiebreak2: null },
          { games1: 6, games2: 7, tiebreak1: 5, tiebreak2: 7 },
        ],
        winnerId: 'player2',
      },
      {
        position: 2,
        player1: { firstName: 'Petra', lastName: 'Wagner' },
        player2: { firstName: 'Sabine', lastName: 'Koch' },
        sets: [
          { games1: 6, games2: 3, tiebreak1: null, tiebreak2: null },
          { games1: 6, games2: 4, tiebreak1: null, tiebreak2: null },
        ],
        winnerId: 'player1',
      },
      {
        position: 3,
        player1: { firstName: 'Monika', lastName: 'Schulz' },
        player2: { firstName: 'Claudia', lastName: 'Berg' },
        sets: [
          { games1: 2, games2: 6, tiebreak1: null, tiebreak2: null },
          { games1: 3, games2: 6, tiebreak1: null, tiebreak2: null },
        ],
        winnerId: 'player2',
      },
      {
        position: 4,
        player1: { firstName: 'Karin', lastName: 'Meier' },
        player2: { firstName: 'Heike', lastName: 'Roth' },
        sets: [
          { games1: 6, games2: 4, tiebreak1: null, tiebreak2: null },
          { games1: 3, games2: 6, tiebreak1: null, tiebreak2: null },
          { games1: 8, games2: 10, tiebreak1: null, tiebreak2: null },
        ],
        winnerId: 'player2',
      },
    ],
  },
  {
    id: 'res-5',
    type: 'RANKING_MATCH',
    title: 'Ranglistenspiel',
    team1: null,
    team2: null,
    player1: { firstName: 'Jan', lastName: 'Richter' },
    player2: { firstName: 'Dirk', lastName: 'Schulz' },
    sets: [
      { games1: 6, games2: 4, tiebreak1: null, tiebreak2: null },
      { games1: 6, games2: 4, tiebreak1: null, tiebreak2: null },
    ],
    winnerId: 'player1',
    isHomeGame: null,
    playedAt: daysAgo(5, 17),
    matches: [],
  },
];

export function getResultById(id: string): RecentResult | undefined {
  return MOCK_RESULTS.find((r) => r.id === id);
}
