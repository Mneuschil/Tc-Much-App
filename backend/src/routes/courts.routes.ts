import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as courtsService from '../services/courts.service';
import { success, error } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

router.get(
  '/occupancy',
  asyncHandler(async (req, res) => {
    const date = (req.query.date as string | undefined) ?? new Date().toISOString().slice(0, 10);
    try {
      const slots = await courtsService.getDayOccupancy(req.user!.clubId, date);
      success(res, slots);
    } catch (e) {
      if (e instanceof Error && e.message === 'INVALID_DATE') {
        error(res, 'Ungültiges Datum', 400, 'VALIDATION_ERROR');
        return;
      }
      throw e;
    }
  }),
);

export default router;
