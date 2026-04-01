import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateNotificationPreferenceSchema } from '@tennis-club/shared';
import * as notificationService from '../services/notification.service';
import { success } from '../utils/apiResponse';

const router = Router();

router.use(requireAuth);

// GET / – Alle Benachrichtigungen des Users
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const notifications = await notificationService.getNotifications(req.user!.userId, unreadOnly);
    success(res, notifications);
  } catch (err) {
    next(err);
  }
});

// PUT /:notificationId/read – Als gelesen markieren
router.put('/:notificationId/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationService.markAsRead(req.params.notificationId as string, req.user!.userId);
    success(res, { message: 'Als gelesen markiert' });
  } catch (err) {
    next(err);
  }
});

// PUT /read-all – Alle als gelesen markieren
router.put('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationService.markAllAsRead(req.user!.userId);
    success(res, { message: 'Alle als gelesen markiert' });
  } catch (err) {
    next(err);
  }
});

// GET /preferences – Benachrichtigungs-Einstellungen abrufen
router.get('/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const preferences = await notificationService.getPreferences(req.user!.userId);
    success(res, preferences);
  } catch (err) {
    next(err);
  }
});

// PUT /preferences – Benachrichtigungs-Einstellungen aendern
router.put('/preferences', validate(updateNotificationPreferenceSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const preference = await notificationService.updatePreference(
      req.user!.userId,
      req.body.type,
      req.body.enabled,
    );
    success(res, preference);
  } catch (err) {
    next(err);
  }
});

export default router;
