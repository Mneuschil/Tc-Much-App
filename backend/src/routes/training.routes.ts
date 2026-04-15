import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireAnyRole } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { setAttendanceSchema, UserRole } from '@tennis-club/shared';
import * as trainingService from '../services/training.service';
import { success } from '../utils/apiResponse';
import { eventIdParams } from '../utils/requestSchemas';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

// GET /groups – Alle Trainingsgruppen
router.get(
  '/groups',
  asyncHandler(async (req, res) => {
    const groups = await trainingService.getTrainingGroups(req.user!.clubId);
    success(res, groups);
  }),
);

// GET /attendance/:eventId – Teilnahmeliste fuer Training
router.get(
  '/attendance/:eventId',
  validate(eventIdParams, 'params'),
  asyncHandler(async (req, res) => {
    const attendance = await trainingService.getAttendanceForEvent(req.params.eventId as string);
    success(res, attendance);
  }),
);

// PUT /attendance – Teilnahme setzen (yes/no, 5h deadline)
router.put(
  '/attendance',
  validate(setAttendanceSchema),
  asyncHandler(async (req, res) => {
    const attendance = await trainingService.setAttendance(
      req.body.eventId,
      req.user!.userId,
      req.body.attending,
    );
    success(res, attendance);
  }),
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
  asyncHandler(async (req, res) => {
    const overview = await trainingService.getTrainerOverview(req.user!.clubId);
    success(res, overview);
  }),
);

export default router;
