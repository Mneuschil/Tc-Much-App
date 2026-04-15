import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/roles';
import { asyncHandler } from '../utils/asyncHandler';
import { success } from '../utils/apiResponse';
import { syncSource, syncAllEnabled } from '../services/websiteSync.service';

const router = Router();

router.use(requireAuth, requireAdmin);

// POST /sync/run — sync all enabled sources
router.post(
  '/run',
  asyncHandler(async (_req, res) => {
    const results = await syncAllEnabled();
    success(res, { sources: results });
  }),
);

// POST /sync/:sourceKey/run — sync single source
router.post(
  '/:sourceKey/run',
  asyncHandler(async (req, res) => {
    const result = await syncSource(req.params.sourceKey as string);
    success(res, result);
  }),
);

export default router;
