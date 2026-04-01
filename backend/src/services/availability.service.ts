import { prisma } from '../config/database';
import * as pushService from './push.service';

export async function checkTeamMembership(eventId: string, userId: string, clubId: string) {
  const event = await prisma.event.findFirst({ where: { id: eventId, clubId } });
  if (!event) {
    throw Object.assign(new Error('Event nicht gefunden'), { statusCode: 404 });
  }

  // For team events, check team membership
  if (event.teamId) {
    const membership = await prisma.teamMember.findFirst({
      where: { teamId: event.teamId, userId },
    });
    if (!membership) {
      // Also allow board/admin
      const roles = await prisma.userRoleAssignment.findMany({
        where: { userId },
        select: { role: true },
      });
      const isPrivileged = roles.some(r => ['CLUB_ADMIN', 'BOARD_MEMBER', 'SYSTEM_ADMIN'].includes(r.role));
      if (!isPrivileged) {
        throw Object.assign(new Error('Nur Team-Mitglieder koennen Verfuegbarkeit setzen'), { statusCode: 403, code: 'NOT_TEAM_MEMBER' });
      }
    }
  }

  return event;
}

export async function getAvailabilityForEvent(eventId: string) {
  return prisma.availability.findMany({
    where: { eventId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });
}

export async function setAvailability(eventId: string, userId: string, status: 'AVAILABLE' | 'NOT_AVAILABLE' | 'MAYBE', comment?: string) {
  return prisma.availability.upsert({
    where: { eventId_userId: { eventId, userId } },
    create: { eventId, userId, status, comment },
    update: { status, comment },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function getAvailabilitySummary(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { teamId: true },
  });

  const availabilities = await prisma.availability.findMany({
    where: { eventId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  const available = availabilities.filter(a => a.status === 'AVAILABLE');
  const notAvailable = availabilities.filter(a => a.status === 'NOT_AVAILABLE');
  const respondedIds = new Set(availabilities.map(a => a.userId));

  // Get team members if team event
  let nonResponders: { id: string; firstName: string; lastName: string }[] = [];
  if (event?.teamId) {
    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId: event.teamId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    nonResponders = teamMembers
      .filter(m => !respondedIds.has(m.userId))
      .map(m => m.user);
  }

  return {
    available: available.length,
    notAvailable: notAvailable.length,
    noResponse: nonResponders.length,
    availableUsers: available.map(a => a.user),
    notAvailableUsers: notAvailable.map(a => a.user),
    nonResponders,
  };
}

export async function sendReminder(eventId: string, clubId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, clubId },
  });
  if (!event) {
    throw Object.assign(new Error('Event nicht gefunden'), { statusCode: 404 });
  }
  if (!event.teamId) {
    throw Object.assign(new Error('Nur Team-Events unterstuetzen Reminders'), { statusCode: 400 });
  }

  // Check how many reminders have been sent by looking at minimum remindersLeft
  const existingReminders = await prisma.availability.findMany({
    where: { eventId },
    select: { remindersLeft: true },
  });

  // If any availability record has remindersLeft <= 0, max reminders reached
  if (existingReminders.some(a => a.remindersLeft <= 0)) {
    throw Object.assign(new Error('Maximale Anzahl Erinnerungen (2) erreicht'), { statusCode: 400, code: 'MAX_REMINDERS_REACHED' });
  }

  // Get non-responders
  const respondedIds = new Set(
    (await prisma.availability.findMany({ where: { eventId }, select: { userId: true } }))
      .map(a => a.userId),
  );

  const teamMembers = await prisma.teamMember.findMany({
    where: { teamId: event.teamId },
    select: { userId: true },
  });

  const nonResponderIds = teamMembers
    .map(m => m.userId)
    .filter(id => !respondedIds.has(id));

  // Always decrement remindersLeft to track reminder count (even if no new non-responders)
  await prisma.availability.updateMany({
    where: { eventId },
    data: { remindersLeft: { decrement: 1 } },
  });

  // Create availability entries for non-responders to track reminder count
  for (const userId of nonResponderIds) {
    await prisma.availability.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, status: 'NOT_AVAILABLE', remindersLeft: 1 },
      update: {},  // already decremented above
    });
  }

  if (nonResponderIds.length === 0) {
    return { sent: 0, message: 'Alle haben bereits geantwortet' };
  }

  // Send push to non-responders
  await pushService.sendToUsers(nonResponderIds, {
    title: 'Verfuegbarkeit eintragen',
    body: `Bitte trage deine Verfuegbarkeit fuer "${event.title}" ein`,
    data: { eventId: event.id },
  });

  return { sent: nonResponderIds.length };
}
