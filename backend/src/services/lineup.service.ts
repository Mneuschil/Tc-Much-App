import { prisma } from '../config/database';
import type { SetLineupInput } from '@tennis-club/shared';
import { SOCKET_ROOMS } from '@tennis-club/shared';
import type { Server } from 'socket.io';
import * as pushService from './push.service';
import { logAudit } from '../utils/audit';

const DEFAULT_TEAM_SIZE = 6;

export async function getLineup(eventId: string) {
  return prisma.matchLineup.findMany({
    where: { eventId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
    orderBy: { position: 'asc' },
  });
}

export async function suggestLineup(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { teamId: true, title: true },
  });
  if (!event?.teamId) {
    throw Object.assign(new Error('Event hat kein zugehoeriges Team'), { statusCode: 400 });
  }

  // Get team size from member count
  const teamMemberCount = await prisma.teamMember.count({ where: { teamId: event.teamId } });
  const teamSize = Math.min(teamMemberCount, DEFAULT_TEAM_SIZE);

  // Get available players who are team members, sorted by position
  const available = await prisma.availability.findMany({
    where: { eventId, status: 'AVAILABLE' },
    select: { userId: true },
  });
  const availableIds = new Set(available.map((a) => a.userId));

  const teamMembers = await prisma.teamMember.findMany({
    where: { teamId: event.teamId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { position: 'asc' },
  });

  const availableMembers = teamMembers.filter((m) => availableIds.has(m.userId));

  const starters = availableMembers.slice(0, teamSize).map((m, i) => ({
    userId: m.userId,
    positionNumber: i + 1,
    userName: `${m.user.firstName} ${m.user.lastName}`,
    positionRank: m.position,
  }));

  const substitutes = availableMembers.slice(teamSize).map((m, i) => ({
    userId: m.userId,
    positionNumber: teamSize + i + 1,
    userName: `${m.user.firstName} ${m.user.lastName}`,
    positionRank: m.position,
  }));

  return { starters, substitutes, teamSize };
}

export async function saveLineup(
  eventId: string,
  teamId: string,
  lineup: { userId: string; position: number }[],
) {
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { teamId: true } });
  if (!event?.teamId) {
    throw Object.assign(new Error('Event hat kein zugehoeriges Team'), { statusCode: 400 });
  }

  await prisma.matchLineup.deleteMany({ where: { eventId } });

  await prisma.matchLineup.createMany({
    data: lineup.map((entry) => ({
      eventId,
      teamId,
      userId: entry.userId,
      position: entry.position,
    })),
  });

  return prisma.matchLineup.findMany({
    where: { eventId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
    orderBy: { position: 'asc' },
  });
}

export async function setLineup(input: SetLineupInput) {
  await prisma.matchLineup.deleteMany({ where: { eventId: input.eventId } });

  await prisma.matchLineup.createMany({
    data: input.lineup.map((entry) => ({
      eventId: input.eventId,
      teamId: input.teamId,
      userId: entry.userId,
      position: entry.position,
    })),
  });

  return prisma.matchLineup.findMany({
    where: { eventId: input.eventId },
    orderBy: { position: 'asc' },
  });
}

export async function confirmLineup(eventId: string) {
  const lineup = await prisma.matchLineup.findMany({
    where: { eventId },
    select: { userId: true, position: true },
  });

  if (lineup.length === 0) {
    throw Object.assign(new Error('Keine Aufstellung vorhanden'), { statusCode: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { title: true, startDate: true },
  });

  const dateStr = event?.startDate
    ? new Date(event.startDate).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'TBD';
  const opponent = event?.title ?? 'unbekannt';

  const notifications = lineup.map((l) =>
    pushService.sendToUsers([l.userId], {
      title: 'Aufstellung bestaetigt',
      body: `Du spielst am ${dateStr} auf Position ${l.position} gegen ${opponent}!`,
      data: { eventId },
    }),
  );
  await Promise.all(notifications);

  return { confirmed: true, notifiedCount: lineup.length };
}

export async function handleAvailabilityChange(eventId: string, userId: string, newStatus: string) {
  if (newStatus !== 'NOT_AVAILABLE') return;

  // Check if user is in the lineup
  const lineupEntry = await prisma.matchLineup.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });
  if (!lineupEntry) return;

  // Get event + team captain
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { title: true, teamId: true },
  });
  if (!event?.teamId) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true },
  });

  // Find team captain (TEAM_CAPTAIN role) or board members
  const captains = await prisma.userRoleAssignment.findMany({
    where: {
      role: { in: ['TEAM_CAPTAIN', 'BOARD_MEMBER', 'CLUB_ADMIN'] },
    },
    select: { userId: true },
  });

  if (captains.length > 0) {
    await pushService.sendToUsers(
      captains.map((c) => c.userId),
      {
        title: 'Absage: Aufgestellter Spieler',
        body: `${user?.firstName} ${user?.lastName} hat fuer "${event.title}" abgesagt und war aufgestellt!`,
        data: { eventId },
      },
    );
  }
}

export async function autoGenerateLineup(eventId: string, teamId: string) {
  const available = await prisma.availability.findMany({
    where: { eventId, status: 'AVAILABLE' },
    include: {
      user: {
        include: {
          teamMemberships: { where: { teamId } },
        },
      },
    },
  });

  const teamMembers = available.filter((a) => a.user.teamMemberships.length > 0);

  teamMembers.sort((a, b) => {
    const posA = a.user.teamMemberships[0]?.position ?? 999;
    const posB = b.user.teamMemberships[0]?.position ?? 999;
    return posA - posB;
  });

  await prisma.matchLineup.deleteMany({ where: { eventId } });

  await prisma.matchLineup.createMany({
    data: teamMembers.map((member, index) => ({
      eventId,
      teamId,
      userId: member.userId,
      position: index + 1,
    })),
  });

  return prisma.matchLineup.findMany({
    where: { eventId },
    orderBy: { position: 'asc' },
  });
}

export async function setLineupAndNotify(
  input: SetLineupInput,
  userId: string,
  clubId: string,
  io: Server | null,
) {
  const lineup = await setLineup(input);
  if (io) {
    io.to(SOCKET_ROOMS.club(clubId)).emit('match:lineup', { eventId: input.eventId });
  }
  logAudit('LINEUP_SET', userId, clubId, { eventId: input.eventId });
  return lineup;
}
