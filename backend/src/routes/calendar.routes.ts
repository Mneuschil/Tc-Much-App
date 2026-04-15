import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as eventService from '../services/event.service';
import * as calendarService from '../services/calendar.service';
import { success } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const events = await eventService.getPersonalCalendar(req.user!.userId, req.user!.clubId);
    success(res, events);
  }),
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { type, from, to } = req.query;
    const events = await calendarService.getCentralCalendar({
      clubId: req.user!.clubId,
      userId: req.user!.userId,
      type: type as string | undefined,
      from: from as string | undefined,
      to: to as string | undefined,
    });
    success(res, events);
  }),
);

router.get(
  '/week',
  asyncHandler(async (req, res) => {
    const events = await calendarService.getWeekEvents(req.user!.clubId);
    success(res, events);
  }),
);

router.get(
  '/export',
  asyncHandler(async (req, res) => {
    const ical = await calendarService.exportIcal(req.user!.clubId);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=tennis-club.ics');
    res.send(ical);
  }),
);

export default router;
