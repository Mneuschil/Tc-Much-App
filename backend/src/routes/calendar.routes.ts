import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import * as eventService from '../services/event.service';
import * as calendarService from '../services/calendar.service';
import { success } from '../utils/apiResponse';

const router = Router();

router.use(requireAuth);

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await eventService.getPersonalCalendar(req.user!.userId, req.user!.clubId);
    success(res, events);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, from, to } = req.query;
    const events = await calendarService.getCentralCalendar({
      clubId: req.user!.clubId,
      userId: req.user!.userId,
      type: type as string | undefined,
      from: from as string | undefined,
      to: to as string | undefined,
    });
    success(res, events);
  } catch (err) {
    next(err);
  }
});

router.get('/week', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await calendarService.getWeekEvents(req.user!.clubId);
    success(res, events);
  } catch (err) {
    next(err);
  }
});

router.get('/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ical = await calendarService.exportIcal(req.user!.clubId);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=tennis-club.ics');
    res.send(ical);
  } catch (err) {
    next(err);
  }
});

export default router;
