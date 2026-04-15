import { subHours } from 'date-fns';
import { prisma } from '../config/database';
import * as pushService from './push.service';
import { AppError } from '../utils/AppError';

// Spec section 11: attendance (yes/no), deadline (5h before), reminder if no response

export async function getTrainingGroups(clubId: string) {
  return prisma.team.findMany({
    where: { clubId, type: 'TRAINING_GROUP' },
    include: {
      members: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      },
      _count: { select: { members: true } },
    },
  });
}

export async function getAttendanceForEvent(eventId: string) {
  return prisma.trainingAttendance.findMany({
    where: { eventId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });
}

export async function setAttendance(eventId: string, userId: string, attending: boolean) {
  // Check deadline (5h before event start)
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw AppError.notFound('Training nicht gefunden');

  const deadline = subHours(event.startDate, 5);
  if (new Date() > deadline) {
    throw AppError.badRequest('Anmeldefrist abgelaufen (5 Stunden vor Trainingsbeginn)');
  }

  return prisma.trainingAttendance.upsert({
    where: { eventId_userId: { eventId, userId } },
    create: {
      eventId,
      userId,
      attending,
      deadlineAt: deadline,
    },
    update: { attending },
  });
}

export async function getTrainerOverview(clubId: string) {
  // Get all upcoming training events with attendance stats
  const trainings = await prisma.event.findMany({
    where: {
      clubId,
      type: 'TRAINING',
      startDate: { gte: new Date() },
    },
    include: {
      trainingAttendances: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      team: { select: { id: true, name: true } },
    },
    orderBy: { startDate: 'asc' },
  });

  return trainings.map((t) => ({
    ...t,
    stats: {
      total: t.trainingAttendances.length,
      attending: t.trainingAttendances.filter((a) => a.attending === true).length,
      notAttending: t.trainingAttendances.filter((a) => a.attending === false).length,
      noResponse: t.trainingAttendances.filter((a) => a.attending === null).length,
    },
  }));
}

export async function sendReminders() {
  // Find training events in next 24h that have members without a response
  const cutoff = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const now = new Date();

  const trainings = await prisma.event.findMany({
    where: {
      type: 'TRAINING',
      startDate: { gte: now, lte: cutoff },
    },
    include: {
      team: {
        include: {
          members: { select: { userId: true } },
        },
      },
      trainingAttendances: { select: { userId: true } },
    },
  });

  let reminded = 0;

  for (const training of trainings) {
    if (!training.team) continue;

    const respondedIds = new Set(training.trainingAttendances.map((a) => a.userId));
    const noResponseIds = training.team.members
      .map((m) => m.userId)
      .filter((id) => !respondedIds.has(id));

    if (noResponseIds.length > 0) {
      await pushService.sendToUsers(noResponseIds, {
        title: 'Training-Erinnerung',
        body: `Bitte trage deine Verfuegbarkeit fuer "${training.title}" ein.`,
        data: { eventId: training.id },
      });
      reminded += noResponseIds.length;
    }
  }

  return { reminded, trainingsChecked: trainings.length };
}
