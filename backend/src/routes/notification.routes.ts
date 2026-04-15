import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateNotificationPreferenceSchema } from '@tennis-club/shared';
import * as notificationService from '../services/notification.service';
import { success, paginated } from '../utils/apiResponse';
import { notificationIdParams, notificationListQuery } from '../utils/requestSchemas';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

// GET / – Benachrichtigungen des Users (paginiert)
router.get(
  '/',
  validate(notificationListQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { unread, page, limit } = req.query as unknown as {
      unread?: string;
      page: number;
      limit: number;
    };
    const unreadOnly = unread === 'true';
    const { notifications, total } = await notificationService.getNotifications(
      req.user!.userId,
      unreadOnly,
      page,
      limit,
    );
    paginated(res, notifications, total, page, limit);
  }),
);

// PUT /:notificationId/read – Als gelesen markieren
router.put(
  '/:notificationId/read',
  validate(notificationIdParams, 'params'),
  asyncHandler(async (req, res) => {
    await notificationService.markAsRead(req.params.notificationId as string, req.user!.userId);
    success(res, { message: 'Als gelesen markiert' });
  }),
);

// PUT /read-all – Alle als gelesen markieren
router.put(
  '/read-all',
  asyncHandler(async (req, res) => {
    await notificationService.markAllAsRead(req.user!.userId);
    success(res, { message: 'Alle als gelesen markiert' });
  }),
);

// GET /preferences – Benachrichtigungs-Einstellungen abrufen
router.get(
  '/preferences',
  asyncHandler(async (req, res) => {
    const preferences = await notificationService.getPreferences(req.user!.userId);
    success(res, preferences);
  }),
);

// PUT /preferences – Benachrichtigungs-Einstellungen aendern
router.put(
  '/preferences',
  validate(updateNotificationPreferenceSchema),
  asyncHandler(async (req, res) => {
    const preference = await notificationService.updatePreference(
      req.user!.userId,
      req.body.type,
      req.body.enabled,
    );
    success(res, preference);
  }),
);

export default router;
