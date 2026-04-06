import { prisma } from '../config/database';
import type { CreateTournamentInput } from '@tennis-club/shared';
import * as bracketService from './bracket.service';
import * as pushService from './push.service';

export async function getTournaments(clubId: string) {
  return prisma.tournament.findMany({
    where: { clubId },
    include: {
      _count: { select: { registrations: true, matches: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { startDate: 'desc' },
  });
}

export async function getTournamentById(tournamentId: string, clubId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      registrations: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
        orderBy: { seed: 'asc' },
      },
      matches: {
        include: {
          player1: { select: { id: true, firstName: true, lastName: true } },
          player2: { select: { id: true, firstName: true, lastName: true } },
          winner: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: [{ round: 'asc' }, { position: 'asc' }],
      },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!tournament || tournament.clubId !== clubId) {
    throw Object.assign(new Error('Turnier nicht gefunden'), { statusCode: 404 });
  }
  return tournament;
}

export async function createTournament(
  input: CreateTournamentInput,
  clubId: string,
  createdById: string,
) {
  return prisma.tournament.create({
    data: {
      name: input.name,
      type: input.type,
      category: input.category,
      description: input.description,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      maxParticipants: input.maxParticipants,
      clubId,
      createdById,
    },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function registerPlayer(tournamentId: string, userId: string, partnerId?: string) {
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) throw Object.assign(new Error('Turnier nicht gefunden'), { statusCode: 404 });
  if (tournament.status !== 'REGISTRATION_OPEN') {
    throw Object.assign(new Error('Anmeldung nicht mehr moeglich'), { statusCode: 400 });
  }

  // Check max participants
  if (tournament.maxParticipants) {
    const count = await prisma.tournamentRegistration.count({ where: { tournamentId } });
    if (count >= tournament.maxParticipants) {
      throw Object.assign(new Error('Maximale Teilnehmerzahl erreicht'), { statusCode: 400 });
    }
  }

  return prisma.tournamentRegistration.create({
    data: {
      tournamentId,
      userId,
      partnerId,
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function getRegistrations(tournamentId: string) {
  return prisma.tournamentRegistration.findMany({
    where: { tournamentId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
    orderBy: { seed: 'asc' },
  });
}

export async function startDraw(tournamentId: string, clubId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      registrations: {
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { seed: 'asc' },
      },
    },
  });
  if (!tournament || tournament.clubId !== clubId) {
    throw Object.assign(new Error('Turnier nicht gefunden'), { statusCode: 404 });
  }
  if (tournament.status !== 'REGISTRATION_OPEN') {
    throw Object.assign(new Error('Auslosung nur bei offener Registrierung moeglich'), {
      statusCode: 400,
    });
  }
  if (tournament.registrations.length < 2) {
    throw Object.assign(new Error('Mindestens 2 Teilnehmer erforderlich'), { statusCode: 400 });
  }

  // Generate bracket
  const bracket = await bracketService.generateBracket(tournamentId, tournament.registrations);

  // Update tournament status
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: 'IN_PROGRESS' },
  });

  // Push to all registered players
  const playerIds = tournament.registrations.map((r) => r.userId);
  await pushService.sendToUsers(playerIds, {
    title: 'Auslosung fertig!',
    body: `Die Auslosung fuer "${tournament.name}" ist abgeschlossen. Schau dir dein Bracket an!`,
    data: { tournamentId },
  });

  return bracket;
}

export async function getBracket(tournamentId: string) {
  return bracketService.getBracket(tournamentId);
}

export async function reportResult(
  tournamentId: string,
  matchId: string,
  winnerId: string,
  score: string,
  clubId: string,
) {
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament || tournament.clubId !== clubId) {
    throw Object.assign(new Error('Turnier nicht gefunden'), { statusCode: 404 });
  }

  const result = await bracketService.advanceWinner(matchId, winnerId, score);

  // Check if tournament is complete (final match decided)
  const _remainingMatches = await prisma.tournamentMatch.count({
    where: {
      tournamentId,
      status: 'SCHEDULED',
      player1Id: { not: null },
      player2Id: { not: null },
    },
  });
  // Also check if there's a winner of the last round
  const allMatches = await prisma.tournamentMatch.findMany({
    where: { tournamentId },
    orderBy: { round: 'desc' },
  });
  const finalMatch = allMatches[0];
  if (finalMatch?.winnerId) {
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: 'COMPLETED' },
    });
  }

  // Push to next opponent if advanced
  if (result) {
    const nextOpponentId = result.player1Id === winnerId ? result.player2Id : result.player1Id;
    if (nextOpponentId) {
      const winner = await prisma.user.findUnique({
        where: { id: winnerId },
        select: { firstName: true, lastName: true },
      });
      await pushService.sendToUsers([nextOpponentId], {
        title: 'Naechster Gegner!',
        body: `Dein naechster Gegner im "${tournament.name}" ist ${winner?.firstName} ${winner?.lastName}.`,
        data: { tournamentId, matchId: result.id },
      });
    }
  }

  return result;
}
