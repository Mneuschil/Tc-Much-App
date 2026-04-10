import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireAdmin, requireBoard } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { updateProfileSchema, updateRolesSchema } from '@tennis-club/shared';
import * as userService from '../services/user.service';
import * as teamService from '../services/team.service';
import { UserError } from '../services/user.service';
import { success, error, paginated } from '../utils/apiResponse';
import { logAudit } from '../utils/audit';

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

// GET /me/teams – eigene Teams
router.get('/me/teams', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teams = await teamService.getMyTeams(req.user!.userId, req.user!.clubId);
    success(res, teams);
  } catch (err) {
    next(err);
  }
});

// PUT /me – eigenes Profil bearbeiten
router.put(
  '/me',
  validate(updateProfileSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await userService.updateProfile(req.user!.userId, req.body);
      success(res, profile);
    } catch (err) {
      handleUserError(err, res, next);
    }
  },
);

// GET / – Club-Mitglieder auflisten (CLUB_ADMIN/BOARD_MEMBER)
router.get('/', requireBoard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const { users, total } = await userService.getClubMembers(
      req.user!.clubId,
      req.query.role as string | undefined,
      page,
      limit,
    );
    paginated(res, users, total, page, limit);
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
router.put(
  '/:userId/roles',
  requireAdmin,
  validate(updateRolesSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await userService.updateUserRoles(
        req.params.userId as string,
        req.body.roles,
        req.user!.userId,
        req.user!.clubId,
      );
      logAudit('ROLES_UPDATED', req.user!.userId, req.user!.clubId, {
        targetUserId: req.params.userId,
        newRoles: req.body.roles,
      });
      success(res, profile);
    } catch (err) {
      handleUserError(err, res, next);
    }
  },
);

export default router;
