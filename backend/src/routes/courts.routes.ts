import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireAnyRole } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { createCourtBookingSchema } from '@tennis-club/shared';
import { UserRole } from '@tennis-club/shared';
import * as courtsService from '../services/courts.service';
import { success, error } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';

const router = Router();

router.use(requireAuth);

// Rollen mit Buchungs-Berechtigung: Admin, Vorstand, Trainer, Mannschaftsführer
const BOOKING_ROLES: UserRole[] = [
  UserRole.CLUB_ADMIN,
  UserRole.BOARD_MEMBER,
  UserRole.TRAINER,
  UserRole.TEAM_CAPTAIN,
];

router.get(
  '/occupancy',
  asyncHandler(async (req, res) => {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    try {
      if (from && to) {
        const slots = await courtsService.getRangeOccupancy(req.user!.clubId, from, to);
        success(res, slots);
        return;
      }
      const date = (req.query.date as string | undefined) ?? new Date().toISOString().slice(0, 10);
      const slots = await courtsService.getDayOccupancy(req.user!.clubId, date);
      success(res, slots);
    } catch (e) {
      if (e instanceof Error && e.message === 'INVALID_DATE') {
        error(res, 'Ungültiges Datum', 400, 'VALIDATION_ERROR');
        return;
      }
      throw e;
    }
  }),
);

router.get(
  '/slots/:eventId',
  asyncHandler(async (req, res) => {
    const detail = await courtsService.getSlotDetail(
      req.user!.clubId,
      req.params.eventId as string,
    );
    if (!detail) {
      error(res, 'Belegung nicht gefunden', 404, 'NOT_FOUND');
      return;
    }
    success(res, detail);
  }),
);

router.post(
  '/bookings',
  requireAnyRole(BOOKING_ROLES),
  validate(createCourtBookingSchema),
  asyncHandler(async (req, res) => {
    try {
      const booking = await courtsService.createBooking(
        req.user!.clubId,
        req.user!.userId,
        req.body,
      );
      success(res, booking, 201);
    } catch (e) {
      if (e instanceof AppError) {
        error(res, e.message, e.statusCode, e.code);
        return;
      }
      throw e;
    }
  }),
);

export default router;
