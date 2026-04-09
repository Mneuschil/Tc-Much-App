import { prisma } from '../config/database';

interface CalendarQueryOptions {
  clubId: string;
  userId: string;
  type?: string;
  from?: string;
  to?: string;
}

export async function getCentralCalendar({ clubId, userId, type, from, to }: CalendarQueryOptions) {
  const events = await prisma.event.findMany({
    where: {
      clubId,
      ...(type
        ? {
            type: type as Parameters<typeof prisma.event.findMany>[0] extends {
              where?: { type?: infer T };
            }
              ? T
              : never,
          }
        : {}),
      ...(from || to
        ? {
            startDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: {
      team: { select: { id: true, name: true } },
      _count: { select: { availabilities: true } },
      trainingAttendances: {
        where: { userId },
        select: { attending: true },
        take: 1,
      },
    },
    orderBy: { startDate: 'asc' },
  });

  return events.map((e) => ({
    ...e,
    myAttendance: e.trainingAttendances[0]?.attending ?? null,
    trainingAttendances: undefined,
  }));
}

export async function getWeekEvents(clubId: string) {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() + mondayOffset);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return prisma.event.findMany({
    where: {
      clubId,
      startDate: { gte: startOfWeek, lte: endOfWeek },
    },
    include: {
      team: { select: { id: true, name: true } },
    },
    orderBy: { startDate: 'asc' },
  });
}

export async function exportIcal(clubId: string): Promise<string> {
  const events = await prisma.event.findMany({
    where: { clubId },
    orderBy: { startDate: 'asc' },
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tennis Club App//DE',
    ...events.flatMap((event) => [
      'BEGIN:VEVENT',
      `UID:${event.id}`,
      `DTSTART:${event.startDate
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}/, '')}`,
      ...(event.endDate
        ? [
            `DTEND:${event.endDate
              .toISOString()
              .replace(/[-:]/g, '')
              .replace(/\.\d{3}/, '')}`,
          ]
        : []),
      `SUMMARY:${event.title}`,
      ...(event.location ? [`LOCATION:${event.location}`] : []),
      ...(event.description ? [`DESCRIPTION:${event.description}`] : []),
      'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ].join('\r\n');
}
