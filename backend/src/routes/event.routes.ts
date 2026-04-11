import { Router } from 'express';
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
import { eventIdParams, eventListQuery } from '../utils/requestSchemas';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

// GET / – Alle Events (filter by type, from, to, teamId)
router.get(
  '/',
  validate(eventListQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { type, from, to, teamId, page, limit } = req.query as unknown as {
      type?: string;
      from?: string;
      to?: string;
      teamId?: string;
      page: number;
      limit: number;
    };
    const result = await eventService.getEventsForClub(req.user!.clubId, {
      type,
      from,
      to,
      teamId,
      page,
      limit,
    });
    res.json({ success: true, data: result.events, pagination: result.pagination });
  }),
);

// POST / – Neues Event erstellen (Board/Admin)
router.post(
  '/',
  requireBoard,
  validate(createEventSchema),
  asyncHandler(async (req, res) => {
    const io = req.app.get('io');
    const event = await eventService.createEventAndNotify(
      req.body,
      req.user!.clubId,
      req.user!.userId,
      io,
    );
    success(res, event, 201);
  }),
);

// GET /:eventId – Event-Details mit Availabilities
router.get(
  '/:eventId',
  validate(eventIdParams, 'params'),
  asyncHandler(async (req, res) => {
    const event = await eventService.getEventById(req.params.eventId as string, req.user!.clubId);
    if (!event) {
      error(res, 'Event nicht gefunden', 404, 'NOT_FOUND');
      return;
    }
    success(res, event);
  }),
);

// PUT /:eventId – Event aktualisieren (Board/Admin) + Push an RSVP-User
router.put(
  '/:eventId',
  requireBoard,
  validate(eventIdParams, 'params'),
  validate(updateEventSchema),
  asyncHandler(async (req, res) => {
    const io = req.app.get('io');
    const updated = await eventService.updateEventAndNotify(
      req.params.eventId as string,
      req.user!.clubId,
      req.body,
      io,
    );
    success(res, updated);
  }),
);

// DELETE /:eventId – Event loeschen (Admin only)
router.delete(
  '/:eventId',
  requireAdmin,
  validate(eventIdParams, 'params'),
  asyncHandler(async (req, res) => {
    await eventService.deleteEvent(req.params.eventId as string, req.user!.clubId);
    logAudit('EVENT_DELETED', req.user!.userId, req.user!.clubId, {
      eventId: req.params.eventId as string,
    });
    success(res, { message: 'Event geloescht' });
  }),
);

// GET /:eventId/availability – Verfuegbarkeiten abrufen
router.get(
  '/:eventId/availability',
  validate(eventIdParams, 'params'),
  asyncHandler(async (req, res) => {
    const availabilities = await availabilityService.getAvailabilityForEvent(
      req.params.eventId as string,
    );
    success(res, availabilities);
  }),
);

// GET /:eventId/availability/summary – Zusammenfassung
router.get(
  '/:eventId/availability/summary',
  validate(eventIdParams, 'params'),
  asyncHandler(async (req, res) => {
    const summary = await availabilityService.getAvailabilitySummary(req.params.eventId as string);
    success(res, summary);
  }),
);

// PUT /:eventId/availability – RSVP setzen (AVAILABLE/NOT_AVAILABLE) mit Team-Membership-Check
router.put(
  '/:eventId/availability',
  validate(eventIdParams, 'params'),
  validate(availabilitySchema),
  asyncHandler(async (req, res) => {
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
  }),
);

// POST /:eventId/availability/remind – Erinnerung senden (max 2)
router.post(
  '/:eventId/availability/remind',
  requireBoard,
  validate(eventIdParams, 'params'),
  asyncHandler(async (req, res) => {
    const result = await availabilityService.sendReminder(
      req.params.eventId as string,
      req.user!.clubId,
    );
    success(res, result);
  }),
);

// ─── Lineup ─────────────────────────────────────────────────────────

// GET /:eventId/lineup/suggest – Auto-Aufstellungsvorschlag
router.get(
  '/:eventId/lineup/suggest',
  validate(eventIdParams, 'params'),
  asyncHandler(async (req, res) => {
    const suggestion = await lineupService.suggestLineup(
      req.params.eventId as string,
      req.user!.clubId,
    );
    success(res, suggestion);
  }),
);

// GET /:eventId/lineup – Gespeicherte Aufstellung
router.get(
  '/:eventId/lineup',
  validate(eventIdParams, 'params'),
  asyncHandler(async (req, res) => {
    const lineup = await lineupService.getLineup(req.params.eventId as string, req.user!.clubId);
    success(res, lineup);
  }),
);

// POST /:eventId/lineup – Aufstellung speichern (Board/Admin)
router.post(
  '/:eventId/lineup',
  requireBoard,
  validate(eventIdParams, 'params'),
  asyncHandler(async (req, res) => {
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
  }),
);

// PUT /:eventId/lineup – Aufstellung aktualisieren (Board/Admin)
router.put(
  '/:eventId/lineup',
  requireBoard,
  validate(eventIdParams, 'params'),
  asyncHandler(async (req, res) => {
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
  }),
);

// POST /:eventId/lineup/confirm – Aufstellung bestaetigen + Push (Board/Admin)
router.post(
  '/:eventId/lineup/confirm',
  requireBoard,
  validate(eventIdParams, 'params'),
  asyncHandler(async (req, res) => {
    const result = await lineupService.confirmLineup(
      req.params.eventId as string,
      req.user!.clubId,
    );
    success(res, result);
  }),
);

// ─── Training Attendance (F15) ──────────────────────────────────────

// POST /:eventId/attendance – Teilnahme setzen (AC-01, AC-02)
router.post(
  '/:eventId/attendance',
  validate(eventIdParams, 'params'),
  asyncHandler(async (req, res) => {
    const attendance = await trainingService.setAttendance(
      req.params.eventId as string,
      req.user!.userId,
      req.body.attending,
    );
    success(res, attendance, 201);
  }),
);

// GET /:eventId/attendance – Teilnahmeliste (AC-03: nur TRAINER/BOARD/ADMIN)
router.get(
  '/:eventId/attendance',
  requireAnyRole([
    UserRole.TRAINER,
    UserRole.BOARD_MEMBER,
    UserRole.CLUB_ADMIN,
    UserRole.SYSTEM_ADMIN,
  ]),
  validate(eventIdParams, 'params'),
  asyncHandler(async (req, res) => {
    const attendance = await trainingService.getAttendanceForEvent(req.params.eventId as string);
    success(res, attendance);
  }),
);

export default router;
