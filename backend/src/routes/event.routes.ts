import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireBoard, requireAdmin } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { createEventSchema, updateEventSchema, availabilitySchema } from '@tennis-club/shared';
import * as eventService from '../services/event.service';
import * as availabilityService from '../services/availability.service';
import * as trainingService from '../services/training.service';
import * as lineupService from '../services/lineup.service';
import { requireAnyRole } from '../middleware/roles';
import { UserRole } from '@tennis-club/shared';
import { success, error } from '../utils/apiResponse';
import { logAudit } from '../utils/audit';

const router = Router();

router.use(requireAuth);

// GET / – Alle Events (filter by type, from, to, teamId)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await eventService.getEventsForClub(req.user!.clubId, {
      type: req.query.type as string,
      from: req.query.from as string,
      to: req.query.to as string,
      teamId: req.query.teamId as string,
    });
    success(res, events);
  } catch (err) {
    next(err);
  }
});

// POST / – Neues Event erstellen (Board/Admin)
router.post(
  '/',
  requireBoard,
  validate(createEventSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const io = req.app.get('io');
      const event = await eventService.createEventAndNotify(
        req.body,
        req.user!.clubId,
        req.user!.userId,
        io,
      );
      success(res, event, 201);
    } catch (err) {
      next(err);
    }
  },
);

// GET /:eventId – Event-Details mit Availabilities
router.get('/:eventId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventService.getEventById(req.params.eventId as string, req.user!.clubId);
    if (!event) {
      error(res, 'Event nicht gefunden', 404, 'NOT_FOUND');
      return;
    }
    success(res, event);
  } catch (err) {
    next(err);
  }
});

// PUT /:eventId – Event aktualisieren (Board/Admin) + Push an RSVP-User
router.put(
  '/:eventId',
  requireBoard,
  validate(updateEventSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const io = req.app.get('io');
      const updated = await eventService.updateEventAndNotify(
        req.params.eventId as string,
        req.user!.clubId,
        req.body,
        io,
      );
      success(res, updated);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /:eventId – Event loeschen (Admin only)
router.delete(
  '/:eventId',
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await eventService.deleteEvent(req.params.eventId as string, req.user!.clubId);
      logAudit('EVENT_DELETED', req.user!.userId, req.user!.clubId, {
        eventId: req.params.eventId,
      });
      success(res, { message: 'Event geloescht' });
    } catch (err) {
      next(err);
    }
  },
);

// GET /:eventId/availability – Verfuegbarkeiten abrufen
router.get('/:eventId/availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const availabilities = await availabilityService.getAvailabilityForEvent(
      req.params.eventId as string,
    );
    success(res, availabilities);
  } catch (err) {
    next(err);
  }
});

// GET /:eventId/availability/summary – Zusammenfassung
router.get(
  '/:eventId/availability/summary',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await availabilityService.getAvailabilitySummary(
        req.params.eventId as string,
      );
      success(res, summary);
    } catch (err) {
      next(err);
    }
  },
);

// PUT /:eventId/availability – RSVP setzen (AVAILABLE/NOT_AVAILABLE) mit Team-Membership-Check
router.put(
  '/:eventId/availability',
  validate(availabilitySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const io = req.app.get('io');
      const availability = await availabilityService.setAvailabilityAndNotify(
        req.params.eventId as string,
        req.user!.userId,
        req.user!.clubId,
        req.body.status,
        req.body.comment,
        io,
      );
      success(res, availability);
    } catch (err) {
      next(err);
    }
  },
);

// POST /:eventId/availability/remind – Erinnerung senden (max 2)
router.post(
  '/:eventId/availability/remind',
  requireBoard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await availabilityService.sendReminder(
        req.params.eventId as string,
        req.user!.clubId,
      );
      success(res, result);
    } catch (err) {
      next(err);
    }
  },
);

// ─── Lineup ─────────────────────────────────────────────────────────

// GET /:eventId/lineup/suggest – Auto-Aufstellungsvorschlag
router.get('/:eventId/lineup/suggest', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const suggestion = await lineupService.suggestLineup(req.params.eventId as string);
    success(res, suggestion);
  } catch (err) {
    next(err);
  }
});

// GET /:eventId/lineup – Gespeicherte Aufstellung
router.get('/:eventId/lineup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lineup = await lineupService.getLineup(req.params.eventId as string);
    success(res, lineup);
  } catch (err) {
    next(err);
  }
});

// POST /:eventId/lineup – Aufstellung speichern (Board/Admin)
router.post(
  '/:eventId/lineup',
  requireBoard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const io = req.app.get('io');
      const lineup = await eventService.saveLineupForEvent(
        req.params.eventId as string,
        req.user!.clubId,
        req.user!.userId,
        req.body.lineup,
        io,
        'LINEUP_SAVED',
      );
      success(res, lineup, 201);
    } catch (err) {
      next(err);
    }
  },
);

// PUT /:eventId/lineup – Aufstellung aktualisieren (Board/Admin)
router.put(
  '/:eventId/lineup',
  requireBoard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const io = req.app.get('io');
      const lineup = await eventService.saveLineupForEvent(
        req.params.eventId as string,
        req.user!.clubId,
        req.user!.userId,
        req.body.lineup,
        io,
        'LINEUP_UPDATED',
      );
      success(res, lineup);
    } catch (err) {
      next(err);
    }
  },
);

// POST /:eventId/lineup/confirm – Aufstellung bestaetigen + Push (Board/Admin)
router.post(
  '/:eventId/lineup/confirm',
  requireBoard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await lineupService.confirmLineup(req.params.eventId as string);
      success(res, result);
    } catch (err) {
      next(err);
    }
  },
);

// ─── Training Attendance (F15) ──────────────────────────────────────

// POST /:eventId/attendance – Teilnahme setzen (AC-01, AC-02)
router.post('/:eventId/attendance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const attendance = await trainingService.setAttendance(
      req.params.eventId as string,
      req.user!.userId,
      req.body.attending,
    );
    success(res, attendance, 201);
  } catch (err) {
    next(err);
  }
});

// GET /:eventId/attendance – Teilnahmeliste (AC-03: nur TRAINER/BOARD/ADMIN)
router.get(
  '/:eventId/attendance',
  requireAnyRole([
    UserRole.TRAINER,
    UserRole.BOARD_MEMBER,
    UserRole.CLUB_ADMIN,
    UserRole.SYSTEM_ADMIN,
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const attendance = await trainingService.getAttendanceForEvent(req.params.eventId as string);
      success(res, attendance);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
