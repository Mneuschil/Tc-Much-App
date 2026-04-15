import { EventType } from '@prisma/client';
import { prisma } from '../config/database';

export type CourtCategory = 'TRAINING' | 'MATCH' | 'RANKING' | 'OTHER';

export interface CourtSlot {
  id: string;
  court: number;
  startTime: string;
  endTime: string;
  category: CourtCategory;
  title: string;
  teamName: string | null;
}

const TYPE_TO_CATEGORY: Record<EventType, CourtCategory> = {
  TRAINING: 'TRAINING',
  LEAGUE_MATCH: 'MATCH',
  CUP_MATCH: 'MATCH',
  CLUB_CHAMPIONSHIP: 'MATCH',
  RANKING_MATCH: 'RANKING',
  CLUB_EVENT: 'OTHER',
  TOURNAMENT: 'OTHER',
};

function parseCourtNumber(raw: string | null): number | null {
  if (!raw) return null;
  const match = raw.match(/(\d+)/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  return Number.isFinite(n) ? n : null;
}

export async function getDayOccupancy(clubId: string, dateISO: string): Promise<CourtSlot[]> {
  const day = new Date(dateISO);
  if (Number.isNaN(day.getTime())) {
    throw new Error('INVALID_DATE');
  }
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);

  const events = await prisma.event.findMany({
    where: {
      clubId,
      court: { not: null },
      startDate: { gte: start, lte: end },
    },
    include: { team: { select: { name: true } } },
    orderBy: { startDate: 'asc' },
  });

  const slots: CourtSlot[] = [];
  for (const e of events) {
    const courtNum = parseCourtNumber(e.court);
    if (courtNum === null) continue;
    const endTime = e.endDate ?? new Date(e.startDate.getTime() + 60 * 60 * 1000);
    slots.push({
      id: e.id,
      court: courtNum,
      startTime: e.startDate.toISOString(),
      endTime: endTime.toISOString(),
      category: TYPE_TO_CATEGORY[e.type],
      title: e.title,
      teamName: e.team?.name ?? null,
    });
  }
  return slots;
}
