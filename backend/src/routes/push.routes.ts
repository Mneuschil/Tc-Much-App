import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as pushService from '../services/push.service';
import { success } from '../utils/apiResponse';
import { tokenParams } from '../utils/requestSchemas';

const router = Router();

router.use(requireAuth);

// POST / – Push-Token registrieren
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, platform } = req.body;
    const result = await pushService.registerToken(req.user!.userId, token, platform);
    success(res, result, 201);
  } catch (err) {
    next(err);
  }
});

// DELETE /:token – Push-Token deaktivieren
router.delete(
  '/:token',
  validate(tokenParams, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await pushService.deactivateToken(req.params.token as string);
      success(res, { message: 'Token deaktiviert' });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
