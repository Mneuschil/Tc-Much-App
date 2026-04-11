import { prisma } from '../config/database';
import type { SubmitResultInput, TennisSet } from '@tennis-club/shared';
import { SOCKET_ROOMS } from '@tennis-club/shared';
import type { Server } from 'socket.io';
import * as rankingService from './ranking.service';
import * as pushService from './push.service';
import * as messageService from './message.service';
import { AppError } from '../utils/AppError';

// Spec section 8: Player A submits → Player B confirms/rejects → dispute → sports manager

export async function submitResult(
  eventId: string,
  input: Omit<SubmitResultInput, 'eventId'>,
  submittedById: string,
  clubId: string,
) {
  // Verify the event exists and belongs to the user's club
  const event = await prisma.event.findFirst({
    where: { id: eventId, clubId },
    select: { id: true, teamId: true, clubId: true, title: true, type: true },
  });
  if (!event) throw AppError.notFound('Event nicht gefunden');

  // AC-09: Only involved players or captain can submit
  if (event.teamId) {
    const isMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: event.teamId, userId: submittedById } },
    });
    if (!isMember) {
      const hasRole = await prisma.userRoleAssignment.findFirst({
        where: {
          userId: submittedById,
          role: { in: ['TEAM_CAPTAIN', 'BOARD_MEMBER', 'CLUB_ADMIN'] },
        },
      });
      if (!hasRole) {
        throw AppError.forbidden('Nur beteiligte Spieler oder Captain koennen Ergebnisse melden');
      }
    }
  }

  const result = await prisma.matchResult.create({
    data: {
      eventId,
      submittedById,
      status: 'SUBMITTED',
      sets: JSON.parse(JSON.stringify(input.sets)),
      winnerId: input.winnerId,
    },
    include: {
      event: true,
      submittedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  // AC-03: Push to opponent (Player B) asking to confirm
  if (event.teamId) {
    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId: event.teamId },
      select: { userId: true },
    });
    const opponentIds = teamMembers.map((m) => m.userId).filter((id) => id !== submittedById);
    if (opponentIds.length > 0) {
      await pushService.sendToUsers(opponentIds, {
        title: 'Ergebnis bestaetigen?',
        body: `${result.submittedBy.firstName} ${result.submittedBy.lastName} hat ein Ergebnis fuer "${event.title}" gemeldet.`,
        data: { eventId, resultId: result.id },
      });
    }
  }

  return result;
}

export async function confirmResult(resultId: string, confirmedById: string, clubId: string) {
  const result = await prisma.matchResult.findFirst({
    where: { id: resultId, event: { clubId } },
    include: { event: true },
  });

  if (!result) throw AppError.notFound('Ergebnis nicht gefunden');
  if (result.status !== 'SUBMITTED')
    throw AppError.badRequest('Ergebnis kann nicht mehr bestaetigt werden');
  if (result.submittedById === confirmedById)
    throw AppError.badRequest('Eigenes Ergebnis kann nicht bestaetigt werden');

  const updated = await prisma.matchResult.update({
    where: { id: resultId },
    data: { status: 'CONFIRMED', confirmedById },
    include: {
      event: true,
      submittedBy: { select: { id: true, firstName: true, lastName: true } },
      confirmedBy: { select: { id: true, firstName: true, lastName: true } },
      winner: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  // Auto-update ranking on confirmation
  if (updated.winnerId) {
    await rankingService
      .updateRankingFromResult(
        updated.event.clubId,
        updated.winnerId,
        updated.submittedById === updated.winnerId ? confirmedById : updated.submittedById,
      )
      .catch(() => {
        /* ranking may not exist */
      });
  }

  // AC-10: Auto-post in General channel for COMPLETED league match
  if (updated.event.type === 'LEAGUE_MATCH') {
    await postResultToGeneral(
      updated.event.clubId,
      updated.event.title,
      updated.sets as unknown as TennisSet[],
      updated.winner,
    );
  }

  return updated;
}

export async function rejectResult(
  resultId: string,
  rejectedById: string,
  reason: string,
  clubId: string,
) {
  const result = await prisma.matchResult.findFirst({
    where: { id: resultId, event: { clubId } },
  });
  if (!result) throw AppError.notFound('Ergebnis nicht gefunden');
  if (result.status !== 'SUBMITTED')
    throw AppError.badRequest('Ergebnis kann nicht mehr abgelehnt werden');

  const updated = await prisma.matchResult.update({
    where: { id: resultId },
    data: {
      status: 'DISPUTED',
      confirmedById: rejectedById,
      rejectionReason: reason,
      disputeNote: reason,
    },
    include: { event: true },
  });

  // AC-06: Push to Sportwart/Board on dispute
  const boardMembers = await prisma.userRoleAssignment.findMany({
    where: {
      clubId: updated.event.clubId,
      role: { in: ['BOARD_MEMBER', 'CLUB_ADMIN'] },
    },
    select: { userId: true },
  });
  if (boardMembers.length > 0) {
    await pushService.sendToUsers(
      boardMembers.map((b) => b.userId),
      {
        title: 'Ergebnis-Streit',
        body: `Ergebnis fuer "${updated.event.title}" wurde abgelehnt und muss geklaert werden.`,
        data: { eventId: updated.eventId, resultId },
      },
    );
  }

  return updated;
}

export async function resolveDispute(
  resultId: string,
  resolvedById: string,
  sets: TennisSet[],
  winnerId: string,
  clubId: string,
) {
  const result = await prisma.matchResult.findFirst({
    where: { id: resultId, event: { clubId } },
    include: { event: true },
  });
  if (!result) throw AppError.notFound('Ergebnis nicht gefunden');
  if (result.status !== 'DISPUTED')
    throw AppError.badRequest('Nur strittige Ergebnisse koennen aufgeloest werden');

  const updated = await prisma.matchResult.update({
    where: { id: resultId },
    data: {
      status: 'CONFIRMED',
      resolvedById,
      sets: JSON.parse(JSON.stringify(sets)),
      winnerId,
    },
    include: {
      event: true,
      winner: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  // Update ranking after dispute resolution
  if (updated.winnerId && updated.confirmedById) {
    const loserId =
      updated.submittedById === updated.winnerId ? updated.confirmedById : updated.submittedById;
    await rankingService
      .updateRankingFromResult(updated.event.clubId, updated.winnerId, loserId)
      .catch(() => {});
  }

  // AC-10: Auto-post for league match
  if (updated.event.type === 'LEAGUE_MATCH') {
    await postResultToGeneral(updated.event.clubId, updated.event.title, sets, updated.winner);
  }

  return updated;
}

export async function getMatchDetail(eventId: string, clubId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, clubId },
    include: {
      team: {
        include: {
          members: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
        },
      },
      matchResults: {
        include: {
          submittedBy: { select: { id: true, firstName: true, lastName: true } },
          confirmedBy: { select: { id: true, firstName: true, lastName: true } },
          winner: { select: { id: true, firstName: true, lastName: true } },
          resolvedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      matchLineups: {
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { position: 'asc' },
      },
    },
  });
  if (!event) throw AppError.notFound('Event nicht gefunden');
  return event;
}

export async function getResultsForEvent(eventId: string, clubId: string) {
  return prisma.matchResult.findMany({
    where: { eventId, event: { clubId } },
    include: {
      submittedBy: { select: { id: true, firstName: true, lastName: true } },
      confirmedBy: { select: { id: true, firstName: true, lastName: true } },
      winner: { select: { id: true, firstName: true, lastName: true } },
      resolvedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

// ─── Composite service functions (route handler refactoring) ───────

export async function submitResultAndNotify(
  eventId: string,
  input: Omit<SubmitResultInput, 'eventId'>,
  submittedById: string,
  clubId: string,
  io: Server | null,
) {
  const result = await submitResult(eventId, input, submittedById, clubId);
  if (io) {
    io.to(SOCKET_ROOMS.club(clubId)).emit('result:submitted', result);
  }
  return result;
}

export async function confirmPendingResult(
  eventId: string,
  confirmedById: string,
  clubId: string,
  io: Server | null,
) {
  const results = await getResultsForEvent(eventId, clubId);
  const pending = results.find((r) => r.status === 'SUBMITTED');
  if (!pending) {
    throw AppError.badRequest('Kein offenes Ergebnis gefunden', 'NO_PENDING_RESULT');
  }
  const result = await confirmResult(pending.id, confirmedById, clubId);
  if (io) {
    io.to(SOCKET_ROOMS.club(clubId)).emit('result:confirmed', result);
  }
  return result;
}

export async function rejectPendingResult(
  eventId: string,
  rejectedById: string,
  reason: string,
  clubId: string,
  io: Server | null,
) {
  const results = await getResultsForEvent(eventId, clubId);
  const pending = results.find((r) => r.status === 'SUBMITTED');
  if (!pending) {
    throw AppError.badRequest('Kein offenes Ergebnis gefunden', 'NO_PENDING_RESULT');
  }
  const result = await rejectResult(pending.id, rejectedById, reason, clubId);
  if (io) {
    io.to(SOCKET_ROOMS.club(clubId)).emit('result:disputed', result);
  }
  return result;
}

export async function resolveEventDispute(
  eventId: string,
  resolvedById: string,
  sets: TennisSet[],
  winnerId: string,
  clubId: string,
) {
  const results = await getResultsForEvent(eventId, clubId);
  const disputed = results.find((r) => r.status === 'DISPUTED');
  if (!disputed) {
    throw AppError.badRequest('Kein strittiges Ergebnis gefunden', 'NO_DISPUTED_RESULT');
  }
  return resolveDispute(disputed.id, resolvedById, sets, winnerId, clubId);
}

// Helper: Auto-post match result to "Allgemein" channel
async function postResultToGeneral(
  clubId: string,
  matchTitle: string,
  sets: TennisSet[],
  winner: { id: string; firstName: string; lastName: string } | null,
) {
  const generalChannel = await prisma.channel.findFirst({
    where: { clubId, name: 'Allgemein' },
  });
  if (!generalChannel) return;

  const setsStr = sets.map((s) => `${s.games1}:${s.games2}`).join(', ');
  const winnerName = winner ? `${winner.firstName} ${winner.lastName}` : 'unbekannt';
  const content = `Ergebnis: ${matchTitle} – Gewinner: ${winnerName} (${setsStr})`;

  // Find a system/admin user to post as
  const admin = await prisma.userRoleAssignment.findFirst({
    where: { clubId, role: 'CLUB_ADMIN' },
    select: { userId: true },
  });
  if (!admin) return;

  await messageService.createMessage(generalChannel.id, { content }, admin.userId);
}
