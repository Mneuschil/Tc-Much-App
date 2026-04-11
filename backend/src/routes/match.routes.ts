import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireBoard } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { setLineupSchema } from '@tennis-club/shared';
import * as matchResultService from '../services/matchResult.service';
import * as lineupService from '../services/lineup.service';
import { success } from '../utils/apiResponse';
import { matchIdParams, eventIdParams } from '../utils/requestSchemas';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

// ─── Match Results (spec section 8) ────────────────────────────────

// GET /:matchId – Match-Detail mit Ergebnis + Status (AC-08)
router.get(
  '/:matchId',
  validate(matchIdParams, 'params'),
  asyncHandler(async (req, res) => {
    const match = await matchResultService.getMatchDetail(
      req.params.matchId as string,
      req.user!.clubId,
    );
    success(res, match);
  }),
);

// POST /:matchId/result – Player A submits result (AC-01)
router.post(
  '/:matchId/result',
  validate(matchIdParams, 'params'),
  asyncHandler(async (req, res) => {
    const result = await matchResultService.submitResultAndNotify(
      req.params.matchId as string,
      { sets: req.body.sets, winnerId: req.body.winnerId },
      req.user!.userId,
      req.user!.clubId,
      req.app.get('io') ?? null,
    );
    success(res, result, 201);
  }),
);

// POST /:matchId/result/confirm – Player B confirms (AC-04)
router.post(
  '/:matchId/result/confirm',
  validate(matchIdParams, 'params'),
  asyncHandler(async (req, res) => {
    const result = await matchResultService.confirmPendingResult(
      req.params.matchId as string,
      req.user!.userId,
      req.user!.clubId,
      req.app.get('io') ?? null,
    );
    success(res, result);
  }),
);

// POST /:matchId/result/reject – Player B rejects -> DISPUTED (AC-05)
router.post(
  '/:matchId/result/reject',
  validate(matchIdParams, 'params'),
  asyncHandler(async (req, res) => {
    const result = await matchResultService.rejectPendingResult(
      req.params.matchId as string,
      req.user!.userId,
      req.body.rejectionReason || req.body.reason || 'Abgelehnt',
      req.user!.clubId,
      req.app.get('io') ?? null,
    );
    success(res, result);
  }),
);

// POST /:matchId/result/resolve – Sportwart resolves dispute (AC-07)
router.post(
  '/:matchId/result/resolve',
  requireBoard,
  validate(matchIdParams, 'params'),
  asyncHandler(async (req, res) => {
    const result = await matchResultService.resolveEventDispute(
      req.params.matchId as string,
      req.user!.userId,
      req.body.sets,
      req.body.winnerId,
      req.user!.clubId,
    );
    success(res, result);
  }),
);

// Legacy: GET /results/event/:eventId – Results for an event
router.get(
  '/results/event/:eventId',
  validate(eventIdParams, 'params'),
  asyncHandler(async (req, res) => {
    const results = await matchResultService.getResultsForEvent(
      req.params.eventId as string,
      req.user!.clubId,
    );
    success(res, results);
  }),
);

// ─── Lineup (spec section 10) ──────────────────────────────────────

// GET /lineup/:eventId – Aufstellung abrufen
router.get(
  '/lineup/:eventId',
  validate(eventIdParams, 'params'),
  asyncHandler(async (req, res) => {
    const lineup = await lineupService.getLineup(req.params.eventId as string, req.user!.clubId);
    success(res, lineup);
  }),
);

// PUT /lineup – Aufstellung manuell setzen (Team Captain / Board)
router.put(
  '/lineup',
  validate(setLineupSchema),
  asyncHandler(async (req, res) => {
    const lineup = await lineupService.setLineupAndNotify(
      req.body,
      req.user!.userId,
      req.user!.clubId,
      req.app.get('io') ?? null,
    );
    success(res, lineup);
  }),
);

// POST /lineup/:eventId/auto – Aufstellung auto-generieren
router.post(
  '/lineup/:eventId/auto',
  validate(eventIdParams, 'params'),
  asyncHandler(async (req, res) => {
    const lineup = await lineupService.autoGenerateLineup(
      req.params.eventId as string,
      req.body.teamId,
      req.user!.clubId,
    );
    success(res, lineup);
  }),
);

export default router;
