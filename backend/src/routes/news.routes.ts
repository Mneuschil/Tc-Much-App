import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { success, error } from '../utils/apiResponse';
import * as newsService from '../services/news.service';

const router = Router();

router.use(requireAuth);

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 50;

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const raw = parseInt((req.query.limit as string) ?? '', 10);
    const limit = Number.isFinite(raw) && raw > 0 ? Math.min(raw, MAX_LIMIT) : DEFAULT_LIMIT;
    const items = await newsService.listNewsForClub(req.user!.clubId, limit);
    success(res, items);
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const item = await newsService.getNewsById(req.user!.clubId, req.params.id as string);
    if (!item) {
      error(res, 'Artikel nicht gefunden', 404, 'NOT_FOUND');
      return;
    }
    success(res, item);
  }),
);

export default router;
