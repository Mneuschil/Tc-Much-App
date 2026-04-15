import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireBoard } from '../middleware/roles';
import { validate } from '../middleware/validate';
import {
  initializeRankingSchema,
  createChallengeSchema,
  respondChallengeSchema,
} from '@tennis-club/shared';
import * as rankingService from '../services/ranking.service';
import { success } from '../utils/apiResponse';
import { userIdParams, idParams } from '../utils/requestSchemas';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

// GET / – Ranking-Tabelle (AC-01: ?category=HERREN filter)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const category = req.query.category as string | undefined;
    const rankings = await rankingService.getRankings(req.user!.clubId, category);

    // AC-04: Add movement indicator
    const enriched = rankings.map((r) => ({
      ...r,
      movement:
        r.previousRank === null
          ? ('STABLE' as const)
          : r.previousRank > r.rank
            ? ('UP' as const)
            : r.previousRank < r.rank
              ? ('DOWN' as const)
              : ('STABLE' as const),
      lastActivity: r.updatedAt,
    }));

    success(res, enriched);
  }),
);

// POST /init – Manuelle Anfangs-Rangliste (AC-02: BOARD/ADMIN)
router.post(
  '/init',
  requireBoard,
  validate(initializeRankingSchema),
  asyncHandler(async (req, res) => {
    const rankings = await rankingService.initializeRanking(req.user!.clubId, req.body);
    success(res, rankings, 201);
  }),
);

// GET /:userId/history – Match-History (AC-06)
router.get(
  '/:userId/history',
  validate(userIdParams, 'params'),
  asyncHandler(async (req, res) => {
    const history = await rankingService.getMatchHistory(
      req.user!.clubId,
      req.params.userId as string,
    );
    success(res, history);
  }),
);

// POST /challenge – Herausforderung senden (AC-07)
router.post(
  '/challenge',
  validate(createChallengeSchema),
  asyncHandler(async (req, res) => {
    const challenge = await rankingService.createChallenge(
      req.user!.clubId,
      req.user!.userId,
      req.body.challengedId,
      req.body.category,
    );
    success(res, challenge, 201);
  }),
);

// POST /challenge/:id/respond – Accept/Decline (AC-07)
router.post(
  '/challenge/:id/respond',
  validate(idParams, 'params'),
  validate(respondChallengeSchema),
  asyncHandler(async (req, res) => {
    const challenge = await rankingService.respondToChallenge(
      req.params.id as string,
      req.user!.userId,
      req.body.action,
    );
    success(res, challenge);
  }),
);

// GET /challenges – Eigene Herausforderungen
router.get(
  '/challenges',
  asyncHandler(async (req, res) => {
    const challenges = await rankingService.getChallengesForUser(
      req.user!.clubId,
      req.user!.userId,
    );
    success(res, challenges);
  }),
);

export default router;
