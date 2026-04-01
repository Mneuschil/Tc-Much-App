import { prisma } from '../config/database';
import type { SubmitResultInput, TennisSet } from '@tennis-club/shared';
import * as rankingService from './ranking.service';
import * as pushService from './push.service';
import * as messageService from './message.service';

// Spec section 8: Player A submits → Player B confirms/rejects → dispute → sports manager

export async function submitResult(eventId: string, input: Omit<SubmitResultInput, 'eventId'>, submittedById: string) {
  // Verify the event exists and get details
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, teamId: true, clubId: true, title: true, type: true },
  });
  if (!event) throw Object.assign(new Error('Event nicht gefunden'), { statusCode: 404 });

  // AC-09: Only involved players or captain can submit
  if (event.teamId) {
    const isMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: event.teamId, userId: submittedById } },
    });
    if (!isMember) {
      const hasRole = await prisma.userRoleAssignment.findFirst({
        where: { userId: submittedById, role: { in: ['TEAM_CAPTAIN', 'BOARD_MEMBER', 'CLUB_ADMIN'] } },
      });
      if (!hasRole) {
        throw Object.assign(new Error('Nur beteiligte Spieler oder Captain koennen Ergebnisse melden'), { statusCode: 403 });
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
    const opponentIds = teamMembers
      .map(m => m.userId)
      .filter(id => id !== submittedById);
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

export async function confirmResult(resultId: string, confirmedById: string) {
  const result = await prisma.matchResult.findUnique({
    where: { id: resultId },
    include: { event: true },
  });

  if (!result) throw Object.assign(new Error('Ergebnis nicht gefunden'), { statusCode: 404 });
  if (result.status !== 'SUBMITTED') throw Object.assign(new Error('Ergebnis kann nicht mehr bestaetigt werden'), { statusCode: 400 });
  if (result.submittedById === confirmedById) throw Object.assign(new Error('Eigenes Ergebnis kann nicht bestaetigt werden'), { statusCode: 400 });

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
    await rankingService.updateRankingFromResult(
      updated.event.clubId,
      updated.winnerId,
      updated.submittedById === updated.winnerId ? confirmedById : updated.submittedById,
    ).catch(() => { /* ranking may not exist */ });
  }

  // AC-10: Auto-post in General channel for COMPLETED league match
  if (updated.event.type === 'LEAGUE_MATCH') {
    await postResultToGeneral(updated.event.clubId, updated.event.title, updated.sets as unknown as TennisSet[], updated.winner);
  }

  return updated;
}

export async function rejectResult(resultId: string, rejectedById: string, reason: string) {
  const result = await prisma.matchResult.findUnique({ where: { id: resultId } });
  if (!result) throw Object.assign(new Error('Ergebnis nicht gefunden'), { statusCode: 404 });
  if (result.status !== 'SUBMITTED') throw Object.assign(new Error('Ergebnis kann nicht mehr abgelehnt werden'), { statusCode: 400 });

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
      boardMembers.map(b => b.userId),
      {
        title: 'Ergebnis-Streit',
        body: `Ergebnis fuer "${updated.event.title}" wurde abgelehnt und muss geklaert werden.`,
        data: { eventId: updated.eventId, resultId },
      },
    );
  }

  return updated;
}

export async function resolveDispute(resultId: string, resolvedById: string, sets: TennisSet[], winnerId: string) {
  const result = await prisma.matchResult.findUnique({
    where: { id: resultId },
    include: { event: true },
  });
  if (!result) throw Object.assign(new Error('Ergebnis nicht gefunden'), { statusCode: 404 });
  if (result.status !== 'DISPUTED') throw Object.assign(new Error('Nur strittige Ergebnisse koennen aufgeloest werden'), { statusCode: 400 });

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
    const loserId = updated.submittedById === updated.winnerId
      ? updated.confirmedById
      : updated.submittedById;
    await rankingService.updateRankingFromResult(updated.event.clubId, updated.winnerId, loserId).catch(() => {});
  }

  // AC-10: Auto-post for league match
  if (updated.event.type === 'LEAGUE_MATCH') {
    await postResultToGeneral(updated.event.clubId, updated.event.title, sets, updated.winner);
  }

  return updated;
}

export async function getMatchDetail(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      team: { include: { members: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } } },
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
  if (!event) throw Object.assign(new Error('Event nicht gefunden'), { statusCode: 404 });
  return event;
}

export async function getResultsForEvent(eventId: string) {
  return prisma.matchResult.findMany({
    where: { eventId },
    include: {
      submittedBy: { select: { id: true, firstName: true, lastName: true } },
      confirmedBy: { select: { id: true, firstName: true, lastName: true } },
      winner: { select: { id: true, firstName: true, lastName: true } },
      resolvedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
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

  const setsStr = sets.map(s => `${s.games1}:${s.games2}`).join(', ');
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
