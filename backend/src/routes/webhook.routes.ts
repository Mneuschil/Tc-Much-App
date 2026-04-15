import { Router } from 'express';
import * as rankingService from '../services/ranking.service';
import * as trainingService from '../services/training.service';
import { requireWebhookAuth } from '../middleware/webhookAuth';
import { success } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(requireWebhookAuth);

// POST /webhooks/ranking-auto-accept – n8n calls this to auto-accept expired challenges
router.post(
  '/ranking-auto-accept',
  asyncHandler(async (req, res) => {
    const result = await rankingService.autoAcceptExpired();
    success(res, result);
  }),
);

// POST /webhooks/training-reminder – n8n calls this to send reminders for upcoming trainings
router.post(
  '/training-reminder',
  asyncHandler(async (req, res) => {
    const result = await trainingService.sendReminders();
    success(res, result);
  }),
);

export default router;
