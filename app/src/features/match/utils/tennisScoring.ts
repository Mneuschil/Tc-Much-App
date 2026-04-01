import type { TennisSet } from '@tennis-club/shared';

export function formatSetScore(set: TennisSet): string {
  let score = `${set.games1}:${set.games2}`;
  if (set.tiebreak1 !== null && set.tiebreak2 !== null) {
    score += ` (${set.tiebreak1}:${set.tiebreak2})`;
  }
  return score;
}

export function formatMatchScore(sets: TennisSet[]): string {
  return sets.map(formatSetScore).join(', ');
}

export function getSetsWon(sets: TennisSet[]): { player1: number; player2: number } {
  let player1 = 0;
  let player2 = 0;

  for (const set of sets) {
    if (set.games1 > set.games2) player1++;
    else if (set.games2 > set.games1) player2++;
  }

  return { player1, player2 };
}

export function isValidSet(set: TennisSet): boolean {
  const { games1, games2 } = set;

  // Regular set: 6-0 through 6-4
  if ((games1 === 6 && games2 <= 4) || (games2 === 6 && games1 <= 4)) return true;
  // Set with 7-5
  if ((games1 === 7 && games2 === 5) || (games2 === 7 && games1 === 5)) return true;
  // Tiebreak set: 7-6
  if ((games1 === 7 && games2 === 6) || (games2 === 7 && games1 === 6)) return true;

  return false;
}
