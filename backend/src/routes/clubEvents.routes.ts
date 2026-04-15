import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { success, error } from '../utils/apiResponse';
import * as clubEventService from '../services/clubEvent.service';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const upcomingOnly = req.query.upcoming !== 'false';
    const items = await clubEventService.listClubEventsForClub(req.user!.clubId, upcomingOnly);
    success(res, items);
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const item = await clubEventService.getClubEventById(req.user!.clubId, req.params.id as string);
    if (!item) {
      error(res, 'Event nicht gefunden', 404, 'NOT_FOUND');
      return;
    }
    success(res, item);
  }),
);

export default router;
