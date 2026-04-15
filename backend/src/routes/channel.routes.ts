import { Router } from 'express';
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
import {
  channelIdParams,
  messageIdParams,
  messageReactionParams,
  channelListQuery,
  messageListQuery,
} from '../utils/requestSchemas';
import type { Server } from 'socket.io';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

// GET / – Channels des Vereins (gefiltert nach Zugriff, paginiert)
router.get(
  '/',
  validate(channelListQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const { channels, total } = await channelService.getChannelsForClub(
      req.user!.clubId,
      req.user!.userId,
      page,
      limit,
    );
    paginated(res, channels, total, page, limit);
  }),
);

// POST / – Neuen Channel erstellen (Board/Admin)
router.post(
  '/',
  requireBoard,
  validate(createChannelSchema),
  asyncHandler(async (req, res) => {
    const channel = await channelService.createChannel(
      req.body,
      req.user!.clubId,
      req.user!.userId,
    );
    logAudit('CHANNEL_CREATED', req.user!.userId, req.user!.clubId, { channelId: channel.id });
    success(res, channel, 201);
  }),
);

// GET /:channelId – Channel-Details mit Subchannels
router.get(
  '/:channelId',
  validate(channelIdParams, 'params'),
  asyncHandler(async (req, res) => {
    const channel = await channelService.getChannelByIdOrFail(
      req.params.channelId as string,
      req.user!.clubId,
    );
    success(res, channel);
  }),
);

// POST /:channelId/subchannels – Subchannel erstellen (max 1 Ebene)
router.post(
  '/:channelId/subchannels',
  requireBoard,
  validate(channelIdParams, 'params'),
  validate(createChannelSchema),
  asyncHandler(async (req, res) => {
    const channel = await channelService.createChannel(
      { ...req.body, parentChannelId: req.params.channelId as string },
      req.user!.clubId,
      req.user!.userId,
    );
    logAudit('SUBCHANNEL_CREATED', req.user!.userId, req.user!.clubId, {
      channelId: channel.id,
      parentChannelId: req.params.channelId as string,
    });
    success(res, channel, 201);
  }),
);

// PUT /:channelId – Channel aktualisieren (Board/Admin)
router.put(
  '/:channelId',
  requireBoard,
  validate(channelIdParams, 'params'),
  validate(updateChannelSchema),
  asyncHandler(async (req, res) => {
    const channel = await channelService.updateChannel(
      req.params.channelId as string,
      req.user!.clubId,
      req.body,
    );
    logAudit('CHANNEL_UPDATED', req.user!.userId, req.user!.clubId, {
      channelId: req.params.channelId as string,
    });
    success(res, channel);
  }),
);

// DELETE /:channelId – Channel loeschen (nur Admin)
router.delete(
  '/:channelId',
  requireAdmin,
  validate(channelIdParams, 'params'),
  asyncHandler(async (req, res) => {
    await channelService.deleteChannel(
      req.params.channelId as string,
      req.user!.clubId,
      req.user!.userId,
    );
    success(res, { message: 'Channel geloescht' });
  }),
);

// POST /:channelId/mute – Stummschaltung toggeln
router.post(
  '/:channelId/mute',
  validate(channelIdParams, 'params'),
  asyncHandler(async (req, res) => {
    const result = await channelService.toggleMute(
      req.params.channelId as string,
      req.user!.userId,
      req.user!.clubId,
    );
    success(res, result);
  }),
);

// GET /:channelId/messages – Nachrichten mit cursor-based pagination + search
router.get(
  '/:channelId/messages',
  validate(channelIdParams, 'params'),
  validate(messageListQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { cursor, limit, search } = req.query as unknown as {
      cursor?: string;
      limit: number;
      search?: string;
    };
    const result = await messageService.getMessagesWithAccessCheck(
      req.params.channelId as string,
      req.user!.userId,
      req.user!.clubId,
      { cursor, limit, search },
    );
    success(res, result);
  }),
);

// POST /:channelId/messages – Nachricht senden (mit Channel-Zugriffspruefung)
router.post(
  '/:channelId/messages',
  validate(channelIdParams, 'params'),
  validate(createMessageSchema),
  asyncHandler(async (req, res) => {
    const io = req.app.get('io') as Server | null;
    const message = await messageService.createMessageAndNotify(
      req.params.channelId as string,
      req.body,
      req.user!.userId,
      req.user!.clubId,
      io,
    );
    success(res, message, 201);
  }),
);

// DELETE /messages/:messageId – Eigene Nachricht oder ADMIN löschen
router.delete(
  '/messages/:messageId',
  validate(messageIdParams, 'params'),
  asyncHandler(async (req, res) => {
    const io = req.app.get('io') as Server | null;
    const isAdmin = req.user!.roles.some((r) => ['CLUB_ADMIN', 'SYSTEM_ADMIN'].includes(r));
    await messageService.deleteMessageAndNotify(
      req.params.messageId as string,
      req.user!.userId,
      io,
      isAdmin,
    );
    success(res, { message: 'Nachricht gelöscht' });
  }),
);

// POST /messages/:messageId/reactions – Reaction hinzufuegen (4 Typen)
router.post(
  '/messages/:messageId/reactions',
  validate(messageIdParams, 'params'),
  validate(messageReactionSchema),
  asyncHandler(async (req, res) => {
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
  }),
);

// DELETE /messages/:messageId/reactions/:type – Reaction entfernen
router.delete(
  '/messages/:messageId/reactions/:type',
  validate(messageReactionParams, 'params'),
  asyncHandler(async (req, res) => {
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
  }),
);

// GET /search – Nachrichten suchen
router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const results = await messageService.searchMessages(
      req.user!.clubId,
      req.query.q as string,
      req.query.channelId as string,
    );
    success(res, results);
  }),
);

export default router;
