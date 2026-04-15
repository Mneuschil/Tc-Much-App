import type { CreateCourtBookingInput, TrainingType } from '@tennis-club/shared';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';

export type CourtCategory = 'TRAINING' | 'MEDENSPIEL' | 'CLUB_EVENT' | 'OTHER';

type EventTypeName =
  | 'LEAGUE_MATCH'
  | 'CUP_MATCH'
  | 'CLUB_CHAMPIONSHIP'
  | 'RANKING_MATCH'
  | 'TRAINING'
  | 'CLUB_EVENT'
  | 'TOURNAMENT';

export interface CourtSlot {
  id: string;
  court: number;
  startTime: string;
  endTime: string;
  category: CourtCategory;
  title: string;
  trainingType: TrainingType | null;
  teamShortCode: string | null;
  teamName: string | null;
  opponentName: string | null;
  isHomeGame: boolean | null;
}

const TYPE_TO_CATEGORY: Record<EventTypeName, CourtCategory> = {
  TRAINING: 'TRAINING',
  LEAGUE_MATCH: 'MEDENSPIEL',
  CUP_MATCH: 'MEDENSPIEL',
  CLUB_CHAMPIONSHIP: 'MEDENSPIEL',
  RANKING_MATCH: 'MEDENSPIEL',
  CLUB_EVENT: 'CLUB_EVENT',
  TOURNAMENT: 'CLUB_EVENT',
};

function parseCourtNumber(raw: string | null): number | null {
  if (!raw) return null;
  const match = raw.match(/(\d+)/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  return Number.isFinite(n) ? n : null;
}

function formatCourt(n: number): string {
  return `Platz ${n}`;
}

export async function getDayOccupancy(clubId: string, dateISO: string): Promise<CourtSlot[]> {
  const day = new Date(dateISO);
  if (Number.isNaN(day.getTime())) throw new Error('INVALID_DATE');
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
    include: { team: { select: { name: true, shortCode: true } } },
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
      category: TYPE_TO_CATEGORY[e.type as EventTypeName],
      title: e.title,
      trainingType: (e.trainingType as TrainingType | null) ?? null,
      teamShortCode: e.team?.shortCode ?? null,
      teamName: e.team?.name ?? null,
      opponentName: e.opponentName,
      isHomeGame: e.isHomeGame,
    });
  }
  return slots;
}

export interface CourtSlotDetail extends CourtSlot {
  description: string | null;
  lineup: Array<{
    position: number;
    userId: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  }>;
}

export async function getSlotDetail(
  clubId: string,
  eventId: string,
): Promise<CourtSlotDetail | null> {
  const e = await prisma.event.findFirst({
    where: { id: eventId, clubId },
    include: {
      team: { select: { name: true, shortCode: true } },
      matchLineups: {
        orderBy: { position: 'asc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      },
    },
  });
  if (!e) return null;
  const courtNum = parseCourtNumber(e.court);
  const endTime = e.endDate ?? new Date(e.startDate.getTime() + 60 * 60 * 1000);

  return {
    id: e.id,
    court: courtNum ?? 0,
    startTime: e.startDate.toISOString(),
    endTime: endTime.toISOString(),
    category: TYPE_TO_CATEGORY[e.type as EventTypeName],
    title: e.title,
    trainingType: (e.trainingType as TrainingType | null) ?? null,
    teamShortCode: e.team?.shortCode ?? null,
    teamName: e.team?.name ?? null,
    opponentName: e.opponentName,
    isHomeGame: e.isHomeGame,
    description: e.description,
    lineup: e.matchLineups.map((l) => ({
      position: l.position,
      userId: l.user.id,
      firstName: l.user.firstName,
      lastName: l.user.lastName,
      avatarUrl: l.user.avatarUrl,
    })),
  };
}

const CATEGORY_TO_EVENT_TYPE = {
  TRAINING: 'TRAINING' as const,
  MEDENSPIEL: 'LEAGUE_MATCH' as const,
  CLUB_EVENT: 'CLUB_EVENT' as const,
};

export async function createBooking(
  clubId: string,
  userId: string,
  input: CreateCourtBookingInput,
) {
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);

  // Überschneidungsprüfung: gleicher Platz + zeitliche Überlappung
  const courtLabel = formatCourt(input.court);
  const conflict = await prisma.event.findFirst({
    where: {
      clubId,
      court: courtLabel,
      startDate: { lt: end },
      OR: [
        { endDate: { gt: start } },
        {
          AND: [
            { endDate: null },
            { startDate: { gt: new Date(start.getTime() - 60 * 60 * 1000) } },
          ],
        },
      ],
    },
    select: { id: true, title: true, startDate: true },
  });
  if (conflict) {
    throw new AppError(
      `Platz ${input.court} ist in diesem Zeitraum bereits belegt (${conflict.title})`,
      409,
      'COURT_CONFLICT',
    );
  }

  const event = await prisma.event.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      type: CATEGORY_TO_EVENT_TYPE[input.category],
      trainingType: input.category === 'TRAINING' ? (input.trainingType ?? null) : null,
      court: courtLabel,
      startDate: start,
      endDate: end,
      teamId: input.teamId ?? null,
      opponentName: input.category === 'MEDENSPIEL' ? (input.opponentName ?? null) : null,
      isHomeGame: input.category === 'MEDENSPIEL' ? (input.isHomeGame ?? true) : null,
      clubId,
      createdById: userId,
    },
    include: { team: { select: { name: true, shortCode: true } } },
  });
  return event;
}
