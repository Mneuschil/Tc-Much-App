import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireBoard, hasMinPermissionLevel } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { createFolderSchema, UserRole } from '@tennis-club/shared';
import * as fileService from '../services/file.service';
import { success } from '../utils/apiResponse';
import { channelIdParams, fileIdParams } from '../utils/requestSchemas';

const router = Router();

router.use(requireAuth);

// GET /channel/:channelId – Dateien eines Channels
router.get(
  '/channel/:channelId',
  validate(channelIdParams, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = await fileService.getFilesForChannel(
        req.params.channelId as string,
        req.query.folderId as string,
      );
      success(res, files);
    } catch (err) {
      next(err);
    }
  },
);

// GET /folders/:channelId – Ordner eines Channels
router.get(
  '/folders/:channelId',
  validate(channelIdParams, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const folders = await fileService.getFoldersForChannel(req.params.channelId as string);
      success(res, folders);
    } catch (err) {
      next(err);
    }
  },
);

// POST /folders – Ordner erstellen (Board/Admin)
router.post(
  '/folders',
  requireBoard,
  validate(createFolderSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const folder = await fileService.createFolder(
        req.body.name,
        req.user!.clubId,
        req.user!.userId,
        req.body.channelId,
      );
      success(res, folder, 201);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /:fileId – Datei loeschen (nur Uploader oder Board+)
router.delete(
  '/:fileId',
  validate(fileIdParams, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isBoardOrAbove = hasMinPermissionLevel(req.user!.roles as UserRole[], 3);
      await fileService.deleteFile(
        req.params.fileId as string,
        req.user!.clubId,
        req.user!.userId,
        isBoardOrAbove,
      );
      success(res, { message: 'Datei geloescht' });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
