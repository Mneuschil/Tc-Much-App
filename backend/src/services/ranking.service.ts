import { prisma } from '../config/database';
import type { InitializeRankingInput } from '@tennis-club/shared';
import * as pushService from './push.service';
import { AppError } from '../utils/AppError';

const DEFAULT_CATEGORY = 'HERREN';
const CHALLENGE_MAX_RANGE = 3;
const CHALLENGE_DEADLINE_DAYS = 14;

// ─── Rankings ───────────────────────────────────────────────────────

export async function getRankings(clubId: string, category?: string) {
  return prisma.ranking.findMany({
    where: { clubId, ...(category ? { category } : {}) },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
    orderBy: { rank: 'asc' },
  });
}

export async function initializeRanking(clubId: string, input: InitializeRankingInput) {
  const category = input.category ?? DEFAULT_CATEGORY;

  // Delete existing rankings for this club+category
  await prisma.ranking.deleteMany({ where: { clubId, category } });

  await prisma.ranking.createMany({
    data: input.rankings.map((r) => ({
      clubId,
      userId: r.userId,
      category,
      rank: r.rank,
      points: r.points ?? 0,
      isManual: true,
    })),
  });

  return prisma.ranking.findMany({
    where: { clubId, category },
    include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    orderBy: { rank: 'asc' },
  });
}

export async function updateRankingFromResult(
  clubId: string,
  winnerId: string,
  loserId: string,
  category?: string,
) {
  const cat = category ?? DEFAULT_CATEGORY;

  const winnerRanking = await prisma.ranking.findUnique({
    where: { clubId_userId_category: { clubId, userId: winnerId, category: cat } },
  });
  const loserRanking = await prisma.ranking.findUnique({
    where: { clubId_userId_category: { clubId, userId: loserId, category: cat } },
  });

  if (!winnerRanking || !loserRanking) return;

  // Save previousRank + update wins/losses
  await prisma.ranking.update({
    where: { id: winnerRanking.id },
    data: {
      wins: { increment: 1 },
      points: { increment: 3 },
      previousRank: winnerRanking.rank,
      isManual: false,
    },
  });

  await prisma.ranking.update({
    where: { id: loserRanking.id },
    data: {
      losses: { increment: 1 },
      previousRank: loserRanking.rank,
      isManual: false,
    },
  });

  // Swap ranks if challenger (lower-ranked = higher rank number) wins
  if (winnerRanking.rank > loserRanking.rank) {
    // Temporarily set winner rank to 0 to avoid unique constraint
    await prisma.ranking.update({
      where: { id: winnerRanking.id },
      data: { rank: 0 },
    });
    await prisma.ranking.update({
      where: { id: loserRanking.id },
      data: { rank: winnerRanking.rank },
    });
    await prisma.ranking.update({
      where: { id: winnerRanking.id },
      data: { rank: loserRanking.rank },
    });
  }
}

export async function getMatchHistory(clubId: string, userId: string) {
  return prisma.matchResult.findMany({
    where: {
      event: { clubId },
      status: 'CONFIRMED',
      OR: [{ submittedById: userId }, { confirmedById: userId }],
    },
    include: {
      event: { select: { id: true, title: true, type: true, startDate: true } },
      submittedBy: { select: { id: true, firstName: true, lastName: true } },
      confirmedBy: { select: { id: true, firstName: true, lastName: true } },
      winner: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ─── Challenge System ───────────────────────────────────────────────

export async function createChallenge(
  clubId: string,
  challengerId: string,
  challengedId: string,
  category?: string,
) {
  const cat = category ?? DEFAULT_CATEGORY;

  const challengerRanking = await prisma.ranking.findUnique({
    where: { clubId_userId_category: { clubId, userId: challengerId, category: cat } },
  });
  const challengedRanking = await prisma.ranking.findUnique({
    where: { clubId_userId_category: { clubId, userId: challengedId, category: cat } },
  });

  if (!challengerRanking || !challengedRanking) {
    throw AppError.badRequest('Beide Spieler muessen in der Rangliste sein');
  }

  // Challenger must be lower-ranked (higher number) and within range
  if (challengerRanking.rank <= challengedRanking.rank) {
    throw AppError.badRequest('Du kannst nur hoeher platzierte Spieler herausfordern');
  }

  const rankDiff = challengerRanking.rank - challengedRanking.rank;
  if (rankDiff > CHALLENGE_MAX_RANGE) {
    throw AppError.badRequest(
      `Maximale Herausforderungsreichweite: ${CHALLENGE_MAX_RANGE} Plaetze`,
    );
  }

  // Check for existing pending challenge between these players
  const existing = await prisma.rankingChallenge.findFirst({
    where: {
      clubId,
      category: cat,
      challengerId,
      challengedId,
      status: 'PENDING',
    },
  });
  if (existing) {
    throw AppError.conflict('Es gibt bereits eine offene Herausforderung');
  }

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + CHALLENGE_DEADLINE_DAYS);

  const challenge = await prisma.rankingChallenge.create({
    data: {
      clubId,
      category: cat,
      challengerId,
      challengedId,
      deadline,
    },
    include: {
      challenger: { select: { id: true, firstName: true, lastName: true } },
      challenged: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  // Push to challenged player
  await pushService.sendToUsers([challengedId], {
    title: 'Neue Herausforderung!',
    body: `${challenge.challenger.firstName} ${challenge.challenger.lastName} fordert dich heraus! Deadline: ${deadline.toLocaleDateString('de-DE')}.`,
    data: { challengeId: challenge.id },
  });

  return challenge;
}

export async function getChallengesForUser(clubId: string, userId: string) {
  return prisma.rankingChallenge.findMany({
    where: {
      clubId,
      OR: [{ challengerId: userId }, { challengedId: userId }],
    },
    include: {
      challenger: { select: { id: true, firstName: true, lastName: true } },
      challenged: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function respondToChallenge(
  challengeId: string,
  userId: string,
  action: 'ACCEPT' | 'DECLINE',
) {
  const challenge = await prisma.rankingChallenge.findUnique({
    where: { id: challengeId },
    include: {
      challenger: { select: { id: true, firstName: true, lastName: true } },
      challenged: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!challenge) {
    throw AppError.notFound('Herausforderung nicht gefunden');
  }

  if (challenge.challengedId !== userId) {
    throw AppError.forbidden('Nur der Herausgeforderte kann antworten');
  }

  if (challenge.status !== 'PENDING') {
    throw AppError.badRequest('Herausforderung ist nicht mehr offen');
  }

  const newStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';

  const updated = await prisma.rankingChallenge.update({
    where: { id: challengeId },
    data: { status: newStatus },
    include: {
      challenger: { select: { id: true, firstName: true, lastName: true } },
      challenged: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  const statusText = action === 'ACCEPT' ? 'angenommen' : 'abgelehnt';
  await pushService.sendToUsers([challenge.challengerId], {
    title: `Herausforderung ${statusText}`,
    body: `${challenge.challenged.firstName} ${challenge.challenged.lastName} hat deine Herausforderung ${statusText}.`,
    data: { challengeId: challenge.id },
  });

  return updated;
}

export async function autoAcceptExpired() {
  const now = new Date();

  const expired = await prisma.rankingChallenge.findMany({
    where: {
      status: 'PENDING',
      deadline: { lte: now },
    },
  });

  const results = [];
  for (const challenge of expired) {
    const updated = await prisma.rankingChallenge.update({
      where: { id: challenge.id },
      data: { status: 'ACCEPTED' },
    });
    results.push(updated);
  }

  return { accepted: results.length, challenges: results };
}
