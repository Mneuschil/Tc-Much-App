import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerPushTokenSchema } from '@tennis-club/shared';
import * as pushService from '../services/push.service';
import { success } from '../utils/apiResponse';
import { tokenParams } from '../utils/requestSchemas';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

// POST / – Push-Token registrieren
router.post(
  '/',
  validate(registerPushTokenSchema),
  asyncHandler(async (req, res) => {
    const { token, platform } = req.body;
    const result = await pushService.registerToken(req.user!.userId, token, platform);
    success(res, result, 201);
  }),
);

// DELETE /:token – Push-Token deaktivieren
router.delete(
  '/:token',
  validate(tokenParams, 'params'),
  asyncHandler(async (req, res) => {
    await pushService.deactivateToken(req.params.token as string);
    success(res, { message: 'Token deaktiviert' });
  }),
);

export default router;
