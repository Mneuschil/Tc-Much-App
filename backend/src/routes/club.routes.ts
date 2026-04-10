import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireAnyRole, requireAdmin } from '../middleware/roles';
import { validate } from '../middleware/validate';
import {
  createClubSchema,
  updateClubSchema,
  verifyClubCodeSchema,
  UserRole,
} from '@tennis-club/shared';
import * as clubService from '../services/club.service';
import { ClubError } from '../services/club.service';
import { success, error } from '../utils/apiResponse';
import { clubIdParams } from '../utils/requestSchemas';

const router = Router();

function handleClubError(err: unknown, res: Response, next: NextFunction) {
  if (err instanceof ClubError) {
    error(res, err.message, err.statusCode, err.code);
  } else {
    next(err);
  }
}

// POST / – Club erstellen (nur SYSTEM_ADMIN)
router.post(
  '/',
  requireAuth,
  requireAnyRole([UserRole.SYSTEM_ADMIN]),
  validate(createClubSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const club = await clubService.createClub(req.body, req.user!.userId);
      success(res, club, 201);
    } catch (err) {
      handleClubError(err, res, next);
    }
  },
);

// POST /verify-code – Club-Code validieren (oeffentlich, kein Auth noetig)
router.post(
  '/verify-code',
  validate(verifyClubCodeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const club = await clubService.verifyClubCode(req.body.clubCode);
      success(res, club);
    } catch (err) {
      handleClubError(err, res, next);
    }
  },
);

// GET /:clubId – Club-Details
router.get(
  '/:clubId',
  requireAuth,
  validate(clubIdParams, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const club = await clubService.getClubById(req.params.clubId as string);
      success(res, club);
    } catch (err) {
      handleClubError(err, res, next);
    }
  },
);

// PUT /:clubId – Club aktualisieren (nur CLUB_ADMIN des eigenen Clubs)
router.put(
  '/:clubId',
  requireAuth,
  requireAdmin,
  validate(clubIdParams, 'params'),
  validate(updateClubSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clubId = req.params.clubId as string;
      if (clubId !== req.user!.clubId) {
        error(res, 'Kein Zugriff auf diesen Club', 403, 'FORBIDDEN');
        return;
      }
      const club = await clubService.updateClub(clubId, req.body);
      success(res, club);
    } catch (err) {
      handleClubError(err, res, next);
    }
  },
);

export default router;
