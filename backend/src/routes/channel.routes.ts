import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireBoard, requireAdmin } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { createChannelSchema, updateChannelSchema, createMessageSchema, messageReactionSchema } from '@tennis-club/shared';
import * as channelService from '../services/channel.service';
import * as messageService from '../services/message.service';
import * as reactionService from '../services/reaction.service';
import * as pushService from '../services/push.service';
import { success, error } from '../utils/apiResponse';

const router = Router();

router.use(requireAuth);

// GET / – Alle Channels des Vereins (gefiltert nach Zugriff)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const channels = await channelService.getChannelsForClub(req.user!.clubId, req.user!.userId);
    success(res, channels);
  } catch (err) {
    next(err);
  }
});

// POST / – Neuen Channel erstellen (Board/Admin)
router.post('/', requireBoard, validate(createChannelSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const channel = await channelService.createChannel(req.body, req.user!.clubId, req.user!.userId);
    success(res, channel, 201);
  } catch (err) {
    next(err);
  }
});

// GET /:channelId – Channel-Details mit Subchannels
router.get('/:channelId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const channel = await channelService.getChannelById(req.params.channelId as string, req.user!.clubId);
    if (!channel) {
      error(res, 'Channel nicht gefunden', 404, 'NOT_FOUND');
      return;
    }
    success(res, channel);
  } catch (err) {
    next(err);
  }
});

// POST /:channelId/subchannels – Subchannel erstellen (max 1 Ebene)
router.post('/:channelId/subchannels', requireBoard, validate(createChannelSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const channel = await channelService.createChannel(
      { ...req.body, parentChannelId: req.params.channelId },
      req.user!.clubId,
      req.user!.userId,
    );
    success(res, channel, 201);
  } catch (err) {
    next(err);
  }
});

// PUT /:channelId – Channel aktualisieren (Board/Admin)
router.put('/:channelId', requireBoard, validate(updateChannelSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const channel = await channelService.updateChannel(req.params.channelId as string, req.user!.clubId, req.body);
    success(res, channel);
  } catch (err) {
    next(err);
  }
});

// DELETE /:channelId – Channel loeschen (nur Admin)
router.delete('/:channelId', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await channelService.deleteChannel(req.params.channelId as string, req.user!.clubId);
    success(res, { message: 'Channel geloescht' });
  } catch (err) {
    next(err);
  }
});

// POST /:channelId/mute – Stummschaltung toggeln
router.post('/:channelId/mute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await channelService.toggleMute(req.params.channelId as string, req.user!.userId, req.user!.clubId);
    success(res, result);
  } catch (err) {
    next(err);
  }
});

// GET /:channelId/messages – Nachrichten mit cursor-based pagination + search
router.get('/:channelId/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await messageService.checkChannelAccess(req.params.channelId as string, req.user!.userId, req.user!.clubId);
    const cursor = req.query.cursor as string | undefined;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;
    const result = await messageService.getChannelMessages(req.params.channelId as string, req.user!.userId, { cursor, limit, search });
    success(res, result);
  } catch (err) {
    next(err);
  }
});

// POST /:channelId/messages – Nachricht senden (mit Channel-Zugriffspruefung)
router.post('/:channelId/messages', validate(createMessageSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await messageService.checkChannelAccess(req.params.channelId as string, req.user!.userId, req.user!.clubId);
    const message = await messageService.createMessage(
      req.params.channelId as string,
      req.body,
      req.user!.userId,
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`channel:${req.params.channelId}`).emit('message:created', message);
    }

    // Push notification (fire-and-forget, exclude author + muted)
    const authorName = `${message.author.firstName} ${message.author.lastName}`;
    pushService.sendToChannel(
      req.params.channelId as string,
      { title: authorName, body: message.content.substring(0, 200), data: { channelId: req.params.channelId, messageId: message.id } },
      req.user!.userId,
    ).catch(err => { /* swallow push errors */ });

    success(res, message, 201);
  } catch (err) {
    next(err);
  }
});

// DELETE /messages/:messageId – Eigene Nachricht loeschen
router.delete('/messages/:messageId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await messageService.deleteMessage(req.params.messageId as string, req.user!.userId);

    const io = req.app.get('io');
    if (io) {
      io.to(`channel:${deleted.channelId}`).emit('message:deleted', { id: deleted.id, channelId: deleted.channelId });
    }

    success(res, { message: 'Nachricht geloescht' });
  } catch (err) {
    next(err);
  }
});

// POST /messages/:messageId/reactions – Reaction hinzufuegen (4 Typen)
router.post('/messages/:messageId/reactions', validate(messageReactionSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reaction = await reactionService.addReaction(req.params.messageId as string, req.user!.userId, req.body.type);
    const aggregated = await reactionService.getAggregatedReactions(req.params.messageId as string, req.user!.userId);

    const io = req.app.get('io');
    if (io) {
      io.to(`club:${req.user!.clubId}`).emit('message:reaction', {
        messageId: req.params.messageId,
        action: 'added',
        type: req.body.type,
        userId: req.user!.userId,
        reactions: aggregated,
      });
    }

    success(res, { reaction, reactions: aggregated }, 201);
  } catch (err) {
    next(err);
  }
});

// DELETE /messages/:messageId/reactions/:type – Reaction entfernen
router.delete('/messages/:messageId/reactions/:type', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await reactionService.removeReaction(req.params.messageId as string, req.user!.userId, req.params.type as 'THUMBS_UP' | 'HEART' | 'CELEBRATE' | 'THINKING');
    const aggregated = await reactionService.getAggregatedReactions(req.params.messageId as string, req.user!.userId);

    const io = req.app.get('io');
    if (io) {
      io.to(`club:${req.user!.clubId}`).emit('message:reaction', {
        messageId: req.params.messageId,
        action: 'removed',
        type: req.params.type,
        userId: req.user!.userId,
        reactions: aggregated,
      });
    }

    success(res, { reactions: aggregated });
  } catch (err) {
    next(err);
  }
});

// GET /search – Nachrichten suchen
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      error(res, 'Suchbegriff erforderlich', 400, 'VALIDATION_ERROR');
      return;
    }
    const results = await messageService.searchMessages(req.user!.clubId, query, req.query.channelId as string);
    success(res, results);
  } catch (err) {
    next(err);
  }
});

export default router;
