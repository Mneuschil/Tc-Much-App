import { SyncedContentStatus } from '@prisma/client';
import { prisma } from '../config/database';

export interface ClubEventItem {
  id: string;
  externalId: number;
  title: string;
  date: string;
  time: string | null;
  category: string;
  description: string | null;
  registrationUrl: string | null;
}

export async function listClubEventsForClub(
  clubId: string,
  upcomingOnly: boolean,
): Promise<ClubEventItem[]> {
  const todayIso = new Date().toISOString().slice(0, 10);
  const rows = await prisma.syncedClubEvent.findMany({
    where: {
      clubId,
      status: SyncedContentStatus.PUBLISHED,
      ...(upcomingOnly ? { date: { gte: todayIso } } : {}),
    },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
    select: {
      id: true,
      externalId: true,
      title: true,
      date: true,
      time: true,
      category: true,
      description: true,
      registrationUrl: true,
    },
  });
  return rows;
}

export async function getClubEventById(clubId: string, id: string): Promise<ClubEventItem | null> {
  return prisma.syncedClubEvent.findFirst({
    where: { id, clubId, status: SyncedContentStatus.PUBLISHED },
    select: {
      id: true,
      externalId: true,
      title: true,
      date: true,
      time: true,
      category: true,
      description: true,
      registrationUrl: true,
    },
  });
}
