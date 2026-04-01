import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireAdmin, requireBoard } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { updateProfileSchema, updateRolesSchema } from '@tennis-club/shared';
import * as userService from '../services/user.service';
import { UserError } from '../services/user.service';
import { success, error } from '../utils/apiResponse';

const router = Router();

router.use(requireAuth);

function handleUserError(err: unknown, res: Response, next: NextFunction) {
  if (err instanceof UserError) {
    error(res, err.message, err.statusCode, err.code);
  } else {
    next(err);
  }
}

// GET /me – eigenes Profil
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await userService.getProfile(req.user!.userId);
    success(res, profile);
  } catch (err) {
    handleUserError(err, res, next);
  }
});

// PUT /me – eigenes Profil bearbeiten
router.put('/me', validate(updateProfileSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await userService.updateProfile(req.user!.userId, req.body);
    success(res, profile);
  } catch (err) {
    handleUserError(err, res, next);
  }
});

// GET / – Club-Mitglieder auflisten (CLUB_ADMIN/BOARD_MEMBER)
router.get('/', requireBoard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const members = await userService.getClubMembers(req.user!.clubId, req.query.role as string | undefined);
    success(res, members);
  } catch (err) {
    handleUserError(err, res, next);
  }
});

// GET /:userId – einzelnes Profil (gleicher Club)
router.get('/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await userService.getUserById(req.params.userId as string, req.user!.clubId);
    success(res, profile);
  } catch (err) {
    handleUserError(err, res, next);
  }
});

// PUT /:userId/roles – Rollen setzen (nur CLUB_ADMIN)
router.put('/:userId/roles', requireAdmin, validate(updateRolesSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await userService.updateUserRoles(
      req.params.userId as string,
      req.body.roles,
      req.user!.userId,
      req.user!.clubId,
    );
    success(res, profile);
  } catch (err) {
    handleUserError(err, res, next);
  }
});

export default router;
