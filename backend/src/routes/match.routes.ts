import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireBoard } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { setLineupSchema, SOCKET_ROOMS } from '@tennis-club/shared';
import * as matchResultService from '../services/matchResult.service';
import * as lineupService from '../services/lineup.service';
import { success, error } from '../utils/apiResponse';
import { logAudit } from '../utils/audit';

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
    const result = await matchResultService.submitResult(
      req.params.matchId as string,
      { sets: req.body.sets, winnerId: req.body.winnerId },
      req.user!.userId,
    );

    const io = req.app.get('io');
    if (io) {
      io.to(SOCKET_ROOMS.club(req.user!.clubId)).emit('result:submitted', result);
    }

    success(res, result, 201);
  } catch (err) {
    next(err);
  }
});

// POST /:matchId/result/confirm – Player B confirms (AC-04)
router.post('/:matchId/result/confirm', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Find the SUBMITTED result for this event
    const results = await matchResultService.getResultsForEvent(req.params.matchId as string);
    const pending = results.find((r) => r.status === 'SUBMITTED');
    if (!pending) {
      error(res, 'Kein offenes Ergebnis gefunden', 400, 'NO_PENDING_RESULT');
      return;
    }

    const result = await matchResultService.confirmResult(pending.id, req.user!.userId);

    const io = req.app.get('io');
    if (io) {
      io.to(SOCKET_ROOMS.club(req.user!.clubId)).emit('result:confirmed', result);
    }

    success(res, result);
  } catch (err) {
    next(err);
  }
});

// POST /:matchId/result/reject – Player B rejects → DISPUTED (AC-05)
router.post('/:matchId/result/reject', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const results = await matchResultService.getResultsForEvent(req.params.matchId as string);
    const pending = results.find((r) => r.status === 'SUBMITTED');
    if (!pending) {
      error(res, 'Kein offenes Ergebnis gefunden', 400, 'NO_PENDING_RESULT');
      return;
    }

    const result = await matchResultService.rejectResult(
      pending.id,
      req.user!.userId,
      req.body.rejectionReason || req.body.reason || 'Abgelehnt',
    );

    const io = req.app.get('io');
    if (io) {
      io.to(SOCKET_ROOMS.club(req.user!.clubId)).emit('result:disputed', result);
    }

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
      const results = await matchResultService.getResultsForEvent(req.params.matchId as string);
      const disputed = results.find((r) => r.status === 'DISPUTED');
      if (!disputed) {
        error(res, 'Kein strittiges Ergebnis gefunden', 400, 'NO_DISPUTED_RESULT');
        return;
      }

      const result = await matchResultService.resolveDispute(
        disputed.id,
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
      const lineup = await lineupService.setLineup(req.body);

      const io = req.app.get('io');
      if (io) {
        io.to(SOCKET_ROOMS.club(req.user!.clubId)).emit('match:lineup', {
          eventId: req.body.eventId,
        });
      }

      logAudit('LINEUP_SET', req.user!.userId, req.user!.clubId, {
        eventId: req.body.eventId,
      });
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
