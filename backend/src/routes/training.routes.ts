import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireAnyRole } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { setAttendanceSchema, UserRole } from '@tennis-club/shared';
import * as trainingService from '../services/training.service';
import { success } from '../utils/apiResponse';
import { eventIdParams } from '../utils/requestSchemas';

const router = Router();

router.use(requireAuth);

// GET /groups – Alle Trainingsgruppen
router.get('/groups', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groups = await trainingService.getTrainingGroups(req.user!.clubId);
    success(res, groups);
  } catch (err) {
    next(err);
  }
});

// GET /attendance/:eventId – Teilnahmeliste fuer Training
router.get(
  '/attendance/:eventId',
  validate(eventIdParams, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const attendance = await trainingService.getAttendanceForEvent(req.params.eventId as string);
      success(res, attendance);
    } catch (err) {
      next(err);
    }
  },
);

// PUT /attendance – Teilnahme setzen (yes/no, 5h deadline)
router.put(
  '/attendance',
  validate(setAttendanceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const attendance = await trainingService.setAttendance(
        req.body.eventId,
        req.user!.userId,
        req.body.attending,
      );
      success(res, attendance);
    } catch (err) {
      next(err);
    }
  },
);

// GET /overview – Trainer-Uebersicht (nur Trainer/Board)
router.get(
  '/overview',
  requireAnyRole([
    UserRole.TRAINER,
    UserRole.BOARD_MEMBER,
    UserRole.CLUB_ADMIN,
    UserRole.SYSTEM_ADMIN,
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const overview = await trainingService.getTrainerOverview(req.user!.clubId);
      success(res, overview);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
