import { prisma } from '../config/database';
import type { CreateEventInput } from '@tennis-club/shared';

export async function getEventsForClub(
  clubId: string,
  opts?: { type?: string; from?: string; to?: string; teamId?: string },
) {
  return prisma.event.findMany({
    where: {
      clubId,
      ...(opts?.type ? { type: opts.type as CreateEventInput['type'] } : {}),
      ...(opts?.teamId ? { teamId: opts.teamId } : {}),
      ...(opts?.from || opts?.to ? {
        startDate: {
          ...(opts?.from ? { gte: new Date(opts.from) } : {}),
          ...(opts?.to ? { lte: new Date(opts.to) } : {}),
        },
      } : {}),
    },
    include: {
      team: { select: { id: true, name: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { availabilities: true } },
    },
    orderBy: { startDate: 'asc' },
  });
}

export async function getEventById(eventId: string, clubId: string) {
  return prisma.event.findFirst({
    where: { id: eventId, clubId },
    include: {
      team: { select: { id: true, name: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      availabilities: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      },
      matchResults: true,
      matchLineups: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { position: 'asc' },
      },
    },
  });
}

export async function createEvent(input: CreateEventInput, clubId: string, createdById: string) {
  return prisma.event.create({
    data: {
      title: input.title,
      description: input.description,
      type: input.type,
      location: input.location,
      court: input.court,
      isHomeGame: input.isHomeGame,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      teamId: input.teamId,
      clubId,
      createdById,
    },
    include: {
      team: { select: { id: true, name: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function updateEvent(eventId: string, clubId: string, input: Partial<CreateEventInput>) {
  const event = await prisma.event.findFirst({ where: { id: eventId, clubId } });
  if (!event) {
    throw Object.assign(new Error('Event nicht gefunden'), { statusCode: 404 });
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.location !== undefined ? { location: input.location } : {}),
      ...(input.court !== undefined ? { court: input.court } : {}),
      ...(input.isHomeGame !== undefined ? { isHomeGame: input.isHomeGame } : {}),
      ...(input.startDate ? { startDate: new Date(input.startDate) } : {}),
      ...(input.endDate ? { endDate: new Date(input.endDate) } : {}),
      ...(input.teamId !== undefined ? { teamId: input.teamId } : {}),
    },
    include: {
      team: { select: { id: true, name: true } },
    },
  });

  return updated;
}

export async function getAvailabilityUserIds(eventId: string): Promise<string[]> {
  const avails = await prisma.availability.findMany({
    where: { eventId },
    select: { userId: true },
  });
  return avails.map(a => a.userId);
}

export async function deleteEvent(eventId: string, clubId: string) {
  const event = await prisma.event.findFirst({ where: { id: eventId, clubId } });
  if (!event) {
    throw Object.assign(new Error('Event nicht gefunden'), { statusCode: 404 });
  }
  return prisma.event.delete({ where: { id: eventId } });
}

export async function getPersonalCalendar(userId: string, clubId: string) {
  // Get user's team IDs
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });
  const teamIds = memberships.map(m => m.teamId);

  // Get events the user has RSVP'd to
  const rsvps = await prisma.availability.findMany({
    where: { userId },
    select: { eventId: true },
  });
  const rsvpEventIds = rsvps.map(r => r.eventId);

  // Aggregate: team events + RSVP events + all club events (CLUB_EVENT type)
  return prisma.event.findMany({
    where: {
      clubId,
      OR: [
        { teamId: { in: teamIds } },
        { id: { in: rsvpEventIds } },
        { type: { in: ['CLUB_EVENT', 'CLUB_CHAMPIONSHIP', 'TOURNAMENT'] } },
      ],
    },
    include: {
      team: { select: { id: true, name: true } },
      availabilities: {
        where: { userId },
        select: { status: true },
      },
    },
    orderBy: { startDate: 'asc' },
  });
}
