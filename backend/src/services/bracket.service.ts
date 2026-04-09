import { prisma } from '../config/database';

interface Registration {
  userId: string;
  seed: number | null;
  user: { id: string; firstName: string; lastName: string };
}

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Next power of 2
function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

// Standard seeding positions for a bracket of size N (slot indices, not match positions)
// Seed 1 at slot 0 (top), Seed 2 at slot N-1 (bottom)
// Seeds 3+4 in opposite halves, etc.
// Uses recursive mirror approach for proper tournament seeding
function getSeedPositions(bracketSize: number): number[] {
  if (bracketSize === 1) return [0];
  if (bracketSize === 2) return [0, 1];

  // Build recursively: for each pair of seed positions in smaller bracket,
  // expand to positions in the larger bracket
  const half = bracketSize / 2;
  const smaller = getSeedPositions(half);

  const result: number[] = [];
  for (const pos of smaller) {
    result.push(pos * 2); // Seed goes to top of their match
    result.push(bracketSize - 1 - pos * 2); // Mirror seed goes to bottom
  }

  return result;
}

export async function generateBracket(
  tournamentId: string,
  registrations: Registration[],
  roundDeadlineDays = 14,
) {
  // Separate seeded and unseeded players
  const seeded = registrations.filter((r) => r.seed !== null).sort((a, b) => a.seed! - b.seed!);
  const unseeded = shuffle(registrations.filter((r) => r.seed === null));

  const totalPlayers = registrations.length;
  const bracketSize = nextPowerOf2(totalPlayers);
  const totalRounds = Math.log2(bracketSize);
  const numByes = bracketSize - totalPlayers;

  // Build ordered player slots using standard seeding
  // Seed positions determine where seeds go; BYEs go opposite seeds (highest seeds get BYEs first)
  const slots: (string | null)[] = new Array(bracketSize).fill(null);
  const seedPositions = getSeedPositions(bracketSize);

  // Place seeded players at their seed positions
  for (let i = 0; i < seeded.length && i < seedPositions.length; i++) {
    slots[seedPositions[i]] = seeded[i].userId;
  }

  // Determine BYE positions: opposite the top seeds
  // For each seed position, the "opposite" in the match is the paired slot
  const byePositions: number[] = [];
  for (let i = 0; i < numByes && i < seedPositions.length; i++) {
    const seedSlot = seedPositions[i];
    // The opponent slot in round 1
    const opponentSlot = seedSlot % 2 === 0 ? seedSlot + 1 : seedSlot - 1;
    if (slots[opponentSlot] === null) {
      byePositions.push(opponentSlot);
    }
  }
  // Mark BYE positions as permanently null (don't fill with players)
  const byeSet = new Set(byePositions);

  // Place unseeded players in remaining non-BYE empty slots
  const fillableSlots = slots
    .map((s, i) => (s === null && !byeSet.has(i) ? i : -1))
    .filter((i) => i >= 0);
  const shuffledFillable = shuffle(fillableSlots);
  for (let i = 0; i < unseeded.length && i < shuffledFillable.length; i++) {
    slots[shuffledFillable[i]] = unseeded[i].userId;
  }

  // Delete existing matches
  await prisma.tournamentMatch.deleteMany({ where: { tournamentId } });

  // Create all round matches (empty placeholders)
  let matchesPerRound = bracketSize / 2;

  for (let round = 1; round <= totalRounds; round++) {
    const roundDeadline = new Date();
    roundDeadline.setDate(roundDeadline.getDate() + roundDeadlineDays * round);

    for (let pos = 1; pos <= matchesPerRound; pos++) {
      if (round === 1) {
        const idx1 = (pos - 1) * 2;
        const idx2 = (pos - 1) * 2 + 1;
        const p1 = slots[idx1];
        const p2 = slots[idx2];

        const isBye = p1 === null || p2 === null;
        const winnerId = isBye ? p1 || p2 : null;
        const status = isBye ? ('WALKOVER' as const) : ('SCHEDULED' as const);

        await prisma.tournamentMatch.create({
          data: {
            tournamentId,
            round,
            position: pos,
            player1Id: p1,
            player2Id: p2,
            winnerId,
            status,
            score: isBye ? 'BYE' : null,
            deadline: roundDeadline,
          },
        });
      } else {
        // Future round placeholder
        await prisma.tournamentMatch.create({
          data: {
            tournamentId,
            round,
            position: pos,
            status: 'SCHEDULED',
            deadline: roundDeadline,
          },
        });
      }
    }
    matchesPerRound = matchesPerRound / 2;
  }

  // Advance BYE winners into round 2
  const round1Byes = await prisma.tournamentMatch.findMany({
    where: { tournamentId, round: 1, status: 'WALKOVER' },
  });

  for (const byeMatch of round1Byes) {
    if (byeMatch.winnerId) {
      await placeInNextRound(tournamentId, byeMatch.position, 1, byeMatch.winnerId);
    }
  }

  return getBracket(tournamentId);
}

async function placeInNextRound(
  tournamentId: string,
  currentPosition: number,
  currentRound: number,
  playerId: string,
) {
  const nextRound = currentRound + 1;
  const nextPosition = Math.ceil(currentPosition / 2);

  const nextMatch = await prisma.tournamentMatch.findFirst({
    where: { tournamentId, round: nextRound, position: nextPosition },
  });

  if (!nextMatch) return;

  // Determine if this player goes into player1 or player2 slot
  const isUpperSlot = currentPosition % 2 === 1; // odd positions → player1

  await prisma.tournamentMatch.update({
    where: { id: nextMatch.id },
    data: isUpperSlot ? { player1Id: playerId } : { player2Id: playerId },
  });
}

export async function advanceWinner(matchId: string, winnerId: string, score: string) {
  const match = await prisma.tournamentMatch.findUnique({ where: { id: matchId } });
  if (!match) throw Object.assign(new Error('Match nicht gefunden'), { statusCode: 404 });
  if (match.status === 'COMPLETED')
    throw Object.assign(new Error('Match bereits abgeschlossen'), { statusCode: 400 });

  // Update current match
  await prisma.tournamentMatch.update({
    where: { id: matchId },
    data: { winnerId, score, status: 'COMPLETED' },
  });

  // Place winner in next round
  await placeInNextRound(match.tournamentId, match.position, match.round, winnerId);

  // Return the next match (if exists)
  const nextRound = match.round + 1;
  const nextPosition = Math.ceil(match.position / 2);

  return prisma.tournamentMatch.findFirst({
    where: { tournamentId: match.tournamentId, round: nextRound, position: nextPosition },
    include: {
      player1: { select: { id: true, firstName: true, lastName: true } },
      player2: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function getBracket(tournamentId: string) {
  const matches = await prisma.tournamentMatch.findMany({
    where: { tournamentId },
    include: {
      player1: { select: { id: true, firstName: true, lastName: true } },
      player2: { select: { id: true, firstName: true, lastName: true } },
      winner: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: [{ round: 'asc' }, { position: 'asc' }],
  });

  // Group by rounds
  const rounds: Record<number, typeof matches> = {};
  for (const m of matches) {
    if (!rounds[m.round]) rounds[m.round] = [];
    rounds[m.round].push(m);
  }

  return Object.entries(rounds).map(([roundNumber, roundMatches]) => ({
    roundNumber: parseInt(roundNumber, 10),
    matches: roundMatches.map((m) => ({
      id: m.id,
      position: m.position,
      player1: m.player1,
      player2: m.player2,
      winner: m.winner,
      score: m.score,
      status: m.status,
    })),
  }));
}
