import { prisma } from '../config/database';
import type { CreateEventInput } from '@tennis-club/shared';
import { SOCKET_ROOMS } from '@tennis-club/shared';
import * as pushService from './push.service';
import * as lineupService from './lineup.service';
import { logAudit } from '../utils/audit';
import { parsePagination, safeTotalPages } from '../utils/pagination';
import type { Server } from 'socket.io';
import { AppError } from '../utils/AppError';

export async function getEventsForClub(
  clubId: string,
  opts?: {
    type?: string;
    from?: string;
    to?: string;
    teamId?: string;
    page?: number;
    limit?: number;
  },
) {
  const { page, limit } = parsePagination(opts?.page, opts?.limit);

  const where = {
    clubId,
    ...(opts?.type ? { type: opts.type as CreateEventInput['type'] } : {}),
    ...(opts?.teamId ? { teamId: opts.teamId } : {}),
    ...(opts?.from || opts?.to
      ? {
          startDate: {
            ...(opts?.from ? { gte: new Date(opts.from) } : {}),
            ...(opts?.to ? { lte: new Date(opts.to) } : {}),
          },
        }
      : {}),
  };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: {
        team: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { availabilities: true } },
      },
      orderBy: { startDate: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.event.count({ where }),
  ]);

  return { events, pagination: { page, limit, total, totalPages: safeTotalPages(total, limit) } };
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

export async function updateEvent(
  eventId: string,
  clubId: string,
  input: Partial<CreateEventInput>,
) {
  const event = await prisma.event.findFirst({ where: { id: eventId, clubId } });
  if (!event) {
    throw AppError.notFound('Event nicht gefunden');
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
  return avails.map((a) => a.userId);
}

export async function deleteEvent(eventId: string, clubId: string) {
  const event = await prisma.event.findFirst({ where: { id: eventId, clubId } });
  if (!event) {
    throw AppError.notFound('Event nicht gefunden');
  }
  return prisma.event.delete({ where: { id: eventId } });
}

export async function createEventAndNotify(
  input: CreateEventInput,
  clubId: string,
  createdById: string,
  io: Server | null,
) {
  const event = await createEvent(input, clubId, createdById);

  if (io) {
    io.to(SOCKET_ROOMS.club(clubId)).emit('event:created', event);
  }

  if (input.teamId) {
    pushService
      .sendToTeam(
        input.teamId,
        {
          title: 'Neues Event',
          body: `"${event.title}" wurde erstellt. Bitte Verfuegbarkeit eintragen.`,
          data: { eventId: event.id },
        },
        createdById,
      )
      .catch(() => {
        /* swallow */
      });
  }

  return event;
}

export async function updateEventAndNotify(
  eventId: string,
  clubId: string,
  input: Partial<CreateEventInput>,
  io: Server | null,
) {
  const updated = await updateEvent(eventId, clubId, input);

  if (io) {
    io.to(SOCKET_ROOMS.club(clubId)).emit('event:updated', { eventId });
  }

  const rsvpUserIds = await getAvailabilityUserIds(eventId);
  if (rsvpUserIds.length > 0) {
    pushService
      .sendToUsers(rsvpUserIds, {
        title: 'Event geaendert',
        body: `"${updated.title}" wurde aktualisiert`,
        data: { eventId: updated.id },
      })
      .catch(() => {
        /* swallow push errors */
      });
  }

  return updated;
}

export async function saveLineupForEvent(
  eventId: string,
  clubId: string,
  userId: string,
  lineupData: { userId: string; position: number }[],
  io: Server | null,
  auditAction: 'LINEUP_SAVED' | 'LINEUP_UPDATED',
) {
  const event = await getEventById(eventId, clubId);
  if (!event) {
    throw AppError.notFound('Event nicht gefunden');
  }

  const lineup = await lineupService.saveLineup(eventId, event.team?.id || '', lineupData);

  if (io) {
    io.to(SOCKET_ROOMS.club(clubId)).emit('match:lineup', { eventId });
  }

  logAudit(auditAction, userId, clubId, { eventId });
  return lineup;
}

export async function getPersonalCalendar(userId: string, clubId: string) {
  // Get user's team IDs
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });
  const teamIds = memberships.map((m) => m.teamId);

  // Get events the user has RSVP'd to
  const rsvps = await prisma.availability.findMany({
    where: { userId },
    select: { eventId: true },
  });
  const rsvpEventIds = rsvps.map((r) => r.eventId);

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
