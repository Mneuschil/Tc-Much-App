import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uploadLimiter } from '../middleware/rateLimiter';
import * as uploadService from '../services/upload.service';
import { success } from '../utils/apiResponse';
import { UserRole, ROLE_HIERARCHY } from '@tennis-club/shared';
import { fileIdParams } from '../utils/requestSchemas';

const router = Router();

router.use(requireAuth);

// POST / – File upload with multer + sharp compression (AC-01, AC-02, AC-03, AC-06)
router.post(
  '/',
  uploadLimiter,
  uploadService.upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw Object.assign(new Error('Keine Datei hochgeladen'), { statusCode: 400 });
      }

      const result = await uploadService.processAndSave(
        req.file,
        req.user!.clubId,
        req.user!.userId,
        req.body.channelId,
        req.body.folderId,
      );

      success(res, result, 201);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /:fileId – Delete file (AC-07: only uploader or ADMIN)
router.delete(
  '/:fileId',
  validate(fileIdParams, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isAdmin = req.user!.roles.some(
        (role: string) => ROLE_HIERARCHY[role as UserRole] >= ROLE_HIERARCHY[UserRole.CLUB_ADMIN],
      );

      const result = await uploadService.deleteFileWithAuth(
        req.params.fileId as string,
        req.user!.userId,
        req.user!.clubId,
        isAdmin,
      );
      success(res, result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
