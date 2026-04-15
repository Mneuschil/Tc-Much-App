import { prisma } from '../config/database';
import type { CreateTournamentInput } from '@tennis-club/shared';
import * as bracketService from './bracket.service';
import * as pushService from './push.service';
import { AppError } from '../utils/AppError';

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
    throw AppError.notFound('Turnier nicht gefunden');
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
  if (!tournament) throw AppError.notFound('Turnier nicht gefunden');
  if (tournament.status !== 'REGISTRATION_OPEN') {
    throw AppError.badRequest('Anmeldung nicht mehr moeglich');
  }

  // Check max participants
  if (tournament.maxParticipants) {
    const count = await prisma.tournamentRegistration.count({ where: { tournamentId } });
    if (count >= tournament.maxParticipants) {
      throw AppError.badRequest('Maximale Teilnehmerzahl erreicht');
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
    throw AppError.notFound('Turnier nicht gefunden');
  }
  if (tournament.status !== 'REGISTRATION_OPEN') {
    throw AppError.badRequest('Auslosung nur bei offener Registrierung moeglich');
  }
  if (tournament.registrations.length < 2) {
    throw AppError.badRequest('Mindestens 2 Teilnehmer erforderlich');
  }

  // Generate bracket
  const bracket = await bracketService.generateBracket(
    tournamentId,
    tournament.registrations,
    tournament.roundDeadlineDays,
  );

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
    throw AppError.notFound('Turnier nicht gefunden');
  }

  // H-06: Validate winnerId is actually a player in the match
  const match = await prisma.tournamentMatch.findUnique({ where: { id: matchId } });
  if (!match) {
    throw AppError.notFound('Match nicht gefunden');
  }
  if (match.winnerId) {
    throw AppError.badRequest('Match bereits abgeschlossen');
  }
  if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
    throw AppError.badRequest('Winner muss ein Spieler des Matches sein', 'INVALID_WINNER');
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
  // C-06: Check if tournament is complete — guard against empty matches array
  const allMatches = await prisma.tournamentMatch.findMany({
    where: { tournamentId },
    orderBy: { round: 'desc' },
  });
  if (allMatches.length > 0) {
    const finalMatch = allMatches[0];
    if (finalMatch.winnerId) {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: 'COMPLETED' },
      });
    }
  }

  // Push to next opponent if advanced
  if (result) {
    const nextOpponentId = result.player1Id === winnerId ? result.player2Id : result.player1Id;
    if (nextOpponentId) {
      // C-07: Guard against deleted/missing winner user
      const winner = await prisma.user.findUnique({
        where: { id: winnerId },
        select: { firstName: true, lastName: true },
      });
      if (winner) {
        await pushService.sendToUsers([nextOpponentId], {
          title: 'Naechster Gegner!',
          body: `Dein naechster Gegner im "${tournament.name}" ist ${winner.firstName} ${winner.lastName}.`,
          data: { tournamentId, matchId: result.id },
        });
      }
    }
  }

  return result;
}
