import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireBoard } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { setLineupSchema } from '@tennis-club/shared';
import * as matchResultService from '../services/matchResult.service';
import * as lineupService from '../services/lineup.service';
import { success } from '../utils/apiResponse';

const router = Router();

router.use(requireAuth);

// ─── Match Results (spec section 8) ────────────────────────────────

// GET /:matchId – Match-Detail mit Ergebnis + Status (AC-08)
router.get('/:matchId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const match = await matchResultService.getMatchDetail(req.params.matchId as string);
    success(res, match);
  } catch (err) {
    next(err);
  }
});

// POST /:matchId/result – Player A submits result (AC-01)
router.post('/:matchId/result', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await matchResultService.submitResultAndNotify(
      req.params.matchId as string,
      { sets: req.body.sets, winnerId: req.body.winnerId },
      req.user!.userId,
      req.user!.clubId,
      req.app.get('io') ?? null,
    );
    success(res, result, 201);
  } catch (err) {
    next(err);
  }
});

// POST /:matchId/result/confirm – Player B confirms (AC-04)
router.post('/:matchId/result/confirm', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await matchResultService.confirmPendingResult(
      req.params.matchId as string,
      req.user!.userId,
      req.user!.clubId,
      req.app.get('io') ?? null,
    );
    success(res, result);
  } catch (err) {
    next(err);
  }
});

// POST /:matchId/result/reject – Player B rejects → DISPUTED (AC-05)
router.post('/:matchId/result/reject', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await matchResultService.rejectPendingResult(
      req.params.matchId as string,
      req.user!.userId,
      req.body.rejectionReason || req.body.reason || 'Abgelehnt',
      req.user!.clubId,
      req.app.get('io') ?? null,
    );
    success(res, result);
  } catch (err) {
    next(err);
  }
});

// POST /:matchId/result/resolve – Sportwart resolves dispute (AC-07)
router.post(
  '/:matchId/result/resolve',
  requireBoard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await matchResultService.resolveEventDispute(
        req.params.matchId as string,
        req.user!.userId,
        req.body.sets,
        req.body.winnerId,
      );
      success(res, result);
    } catch (err) {
      next(err);
    }
  },
);

// Legacy: GET /results/event/:eventId – Results for an event
router.get('/results/event/:eventId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const results = await matchResultService.getResultsForEvent(req.params.eventId as string);
    success(res, results);
  } catch (err) {
    next(err);
  }
});

// ─── Lineup (spec section 10) ──────────────────────────────────────

// GET /lineup/:eventId – Aufstellung abrufen
router.get('/lineup/:eventId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lineup = await lineupService.getLineup(req.params.eventId as string);
    success(res, lineup);
  } catch (err) {
    next(err);
  }
});

// PUT /lineup – Aufstellung manuell setzen (Team Captain / Board)
router.put(
  '/lineup',
  validate(setLineupSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lineup = await lineupService.setLineupAndNotify(
        req.body,
        req.user!.userId,
        req.user!.clubId,
        req.app.get('io') ?? null,
      );
      success(res, lineup);
    } catch (err) {
      next(err);
    }
  },
);

// POST /lineup/:eventId/auto – Aufstellung auto-generieren
router.post('/lineup/:eventId/auto', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lineup = await lineupService.autoGenerateLineup(
      req.params.eventId as string,
      req.body.teamId,
    );
    success(res, lineup);
  } catch (err) {
    next(err);
  }
});

export default router;
