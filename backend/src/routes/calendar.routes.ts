import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../config/database';
import * as eventService from '../services/event.service';
import { success } from '../utils/apiResponse';

const router = Router();

router.use(requireAuth);

// GET /me – Persoenlicher Kalender (Team-Events + RSVP-Events + Club-Events)
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await eventService.getPersonalCalendar(req.user!.userId, req.user!.clubId);
    success(res, events);
  } catch (err) {
    next(err);
  }
});

// GET / – Zentraler Kalender (alle Events, sichtbar fuer alle)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, from, to } = req.query;

    const events = await prisma.event.findMany({
      where: {
        clubId: req.user!.clubId,
        ...(type ? { type: type as Parameters<typeof prisma.event.findMany>[0] extends { where?: { type?: infer T } } ? T : never } : {}),
        ...(from || to ? {
          startDate: {
            ...(from ? { gte: new Date(from as string) } : {}),
            ...(to ? { lte: new Date(to as string) } : {}),
          },
        } : {}),
      },
      include: {
        team: { select: { id: true, name: true } },
        _count: { select: { availabilities: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    success(res, events);
  } catch (err) {
    next(err);
  }
});

// GET /week – Wochenkalender
router.get('/week', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const events = await prisma.event.findMany({
      where: {
        clubId: req.user!.clubId,
        startDate: { gte: startOfWeek, lte: endOfWeek },
      },
      include: {
        team: { select: { id: true, name: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    success(res, events);
  } catch (err) {
    next(err);
  }
});

// GET /export – iCal Export
router.get('/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await prisma.event.findMany({
      where: { clubId: req.user!.clubId },
      orderBy: { startDate: 'asc' },
    });

    const ical = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Tennis Club App//DE',
      ...events.flatMap((event) => [
        'BEGIN:VEVENT',
        `UID:${event.id}`,
        `DTSTART:${event.startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
        ...(event.endDate ? [`DTEND:${event.endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`] : []),
        `SUMMARY:${event.title}`,
        ...(event.location ? [`LOCATION:${event.location}`] : []),
        ...(event.description ? [`DESCRIPTION:${event.description}`] : []),
        'END:VEVENT',
      ]),
      'END:VCALENDAR',
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=tennis-club.ics');
    res.send(ical);
  } catch (err) {
    next(err);
  }
});

export default router;
