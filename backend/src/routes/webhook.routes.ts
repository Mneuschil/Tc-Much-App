import { Router, Request, Response, NextFunction } from 'express';
import * as rankingService from '../services/ranking.service';
import * as trainingService from '../services/training.service';
import { success } from '../utils/apiResponse';

const router = Router();

// POST /webhooks/ranking-auto-accept – n8n calls this to auto-accept expired challenges
router.post('/ranking-auto-accept', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await rankingService.autoAcceptExpired();
    success(res, result);
  } catch (err) {
    next(err);
  }
});

// POST /webhooks/training-reminder – n8n calls this to send reminders for upcoming trainings
router.post('/training-reminder', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await trainingService.sendReminders();
    success(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
