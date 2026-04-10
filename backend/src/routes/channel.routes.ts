import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireBoard, requireAdmin } from '../middleware/roles';
import { validate } from '../middleware/validate';
import {
  createChannelSchema,
  updateChannelSchema,
  createMessageSchema,
  messageReactionSchema,
} from '@tennis-club/shared';
import * as channelService from '../services/channel.service';
import * as messageService from '../services/message.service';
import * as reactionService from '../services/reaction.service';
import { success, paginated } from '../utils/apiResponse';
import { logAudit } from '../utils/audit';
import type { Server } from 'socket.io';

const router = Router();

router.use(requireAuth);

// GET / – Channels des Vereins (gefiltert nach Zugriff, paginiert)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const { channels, total } = await channelService.getChannelsForClub(
      req.user!.clubId,
      req.user!.userId,
      page,
      limit,
    );
    paginated(res, channels, total, page, limit);
  } catch (err) {
    next(err);
  }
});

// POST / – Neuen Channel erstellen (Board/Admin)
router.post(
  '/',
  requireBoard,
  validate(createChannelSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const channel = await channelService.createChannel(
        req.body,
        req.user!.clubId,
        req.user!.userId,
      );
      logAudit('CHANNEL_CREATED', req.user!.userId, req.user!.clubId, { channelId: channel.id });
      success(res, channel, 201);
    } catch (err) {
      next(err);
    }
  },
);

// GET /:channelId – Channel-Details mit Subchannels
router.get('/:channelId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const channel = await channelService.getChannelByIdOrFail(
      req.params.channelId as string,
      req.user!.clubId,
    );
    success(res, channel);
  } catch (err) {
    next(err);
  }
});

// POST /:channelId/subchannels – Subchannel erstellen (max 1 Ebene)
router.post(
  '/:channelId/subchannels',
  requireBoard,
  validate(createChannelSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const channel = await channelService.createChannel(
        { ...req.body, parentChannelId: req.params.channelId },
        req.user!.clubId,
        req.user!.userId,
      );
      logAudit('SUBCHANNEL_CREATED', req.user!.userId, req.user!.clubId, {
        channelId: channel.id,
        parentChannelId: req.params.channelId,
      });
      success(res, channel, 201);
    } catch (err) {
      next(err);
    }
  },
);

// PUT /:channelId – Channel aktualisieren (Board/Admin)
router.put(
  '/:channelId',
  requireBoard,
  validate(updateChannelSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const channel = await channelService.updateChannel(
        req.params.channelId as string,
        req.user!.clubId,
        req.body,
      );
      logAudit('CHANNEL_UPDATED', req.user!.userId, req.user!.clubId, {
        channelId: req.params.channelId,
      });
      success(res, channel);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /:channelId – Channel loeschen (nur Admin)
router.delete(
  '/:channelId',
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await channelService.deleteChannel(
        req.params.channelId as string,
        req.user!.clubId,
        req.user!.userId,
      );
      success(res, { message: 'Channel geloescht' });
    } catch (err) {
      next(err);
    }
  },
);

// POST /:channelId/mute – Stummschaltung toggeln
router.post('/:channelId/mute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await channelService.toggleMute(
      req.params.channelId as string,
      req.user!.userId,
      req.user!.clubId,
    );
    success(res, result);
  } catch (err) {
    next(err);
  }
});

// GET /:channelId/messages – Nachrichten mit cursor-based pagination + search
router.get('/:channelId/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await messageService.getMessagesWithAccessCheck(
      req.params.channelId as string,
      req.user!.userId,
      req.user!.clubId,
      {
        cursor: req.query.cursor as string | undefined,
        limit: parseInt(req.query.limit as string) || 20,
        search: req.query.search as string | undefined,
      },
    );
    success(res, result);
  } catch (err) {
    next(err);
  }
});

// POST /:channelId/messages – Nachricht senden (mit Channel-Zugriffspruefung)
router.post(
  '/:channelId/messages',
  validate(createMessageSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const io = req.app.get('io') as Server | null;
      const message = await messageService.createMessageAndNotify(
        req.params.channelId as string,
        req.body,
        req.user!.userId,
        req.user!.clubId,
        io,
      );
      success(res, message, 201);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /messages/:messageId – Eigene Nachricht oder ADMIN löschen
router.delete('/messages/:messageId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const io = req.app.get('io') as Server | null;
    const isAdmin = req.user!.roles.some((r) => ['CLUB_ADMIN', 'SYSTEM_ADMIN'].includes(r));
    await messageService.deleteMessageAndNotify(
      req.params.messageId as string,
      req.user!.userId,
      io,
      isAdmin,
    );
    success(res, { message: 'Nachricht gelöscht' });
  } catch (err) {
    next(err);
  }
});

// POST /messages/:messageId/reactions – Reaction hinzufuegen (4 Typen)
router.post(
  '/messages/:messageId/reactions',
  validate(messageReactionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const io = req.app.get('io') as Server | null;
      const result = await reactionService.addReactionAndNotify(
        {
          messageId: req.params.messageId as string,
          userId: req.user!.userId,
          clubId: req.user!.clubId,
          io,
        },
        req.body.type,
      );
      success(res, result, 201);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /messages/:messageId/reactions/:type – Reaction entfernen
router.delete(
  '/messages/:messageId/reactions/:type',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const io = req.app.get('io') as Server | null;
      const result = await reactionService.removeReactionAndNotify(
        {
          messageId: req.params.messageId as string,
          userId: req.user!.userId,
          clubId: req.user!.clubId,
          io,
        },
        req.params.type as 'THUMBS_UP' | 'HEART' | 'CELEBRATE' | 'THINKING',
      );
      success(res, result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /search – Nachrichten suchen
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const results = await messageService.searchMessages(
      req.user!.clubId,
      req.query.q as string,
      req.query.channelId as string,
    );
    success(res, results);
  } catch (err) {
    next(err);
  }
});

export default router;
