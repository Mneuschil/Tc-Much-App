import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireBoard } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { createTournamentSchema, reportResultSchema, tournamentRegistrationSchema } from '@tennis-club/shared';
import * as tournamentService from '../services/tournament.service';
import { success, error } from '../utils/apiResponse';

const router = Router();

router.use(requireAuth);

// GET / – Alle Turniere des Vereins
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tournaments = await tournamentService.getTournaments(req.user!.clubId);
    success(res, tournaments);
  } catch (err) {
    next(err);
  }
});

// POST / – Neues Turnier erstellen (AC-01: KNOCKOUT, category, deadline, maxParticipants)
router.post('/', requireBoard, validate(createTournamentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tournament = await tournamentService.createTournament(req.body, req.user!.clubId, req.user!.userId);
    success(res, tournament, 201);
  } catch (err) {
    next(err);
  }
});

// GET /:tournamentId – Turnier-Details
router.get('/:tournamentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tournament = await tournamentService.getTournamentById(req.params.tournamentId as string, req.user!.clubId);
    success(res, tournament);
  } catch (err) {
    next(err);
  }
});

// POST /:tournamentId/register – Anmelden (AC-02: DOUBLES mit partnerId)
router.post('/:tournamentId/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reg = await tournamentService.registerPlayer(
      req.params.tournamentId as string,
      req.user!.userId,
      req.body.partnerId,
    );
    success(res, reg, 201);
  } catch (err) {
    next(err);
  }
});

// GET /:tournamentId/registrations – Alle Anmeldungen (AC-03)
router.get('/:tournamentId/registrations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const regs = await tournamentService.getRegistrations(req.params.tournamentId as string);
    success(res, regs);
  } catch (err) {
    next(err);
  }
});

// POST /:tournamentId/draw – Auslosung (AC-04, AC-05)
router.post('/:tournamentId/draw', requireBoard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bracket = await tournamentService.startDraw(req.params.tournamentId as string, req.user!.clubId);
    success(res, bracket, 201);
  } catch (err) {
    next(err);
  }
});

// GET /:tournamentId/bracket – KO-Tableau (AC-06, AC-07)
router.get('/:tournamentId/bracket', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bracket = await tournamentService.getBracket(req.params.tournamentId as string);
    success(res, bracket);
  } catch (err) {
    next(err);
  }
});

// POST /:tournamentId/result – Ergebnis melden (AC-08, AC-09)
router.post('/:tournamentId/result', validate(reportResultSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await tournamentService.reportResult(
      req.params.tournamentId as string,
      req.body.matchId,
      req.body.winnerId,
      req.body.score,
      req.user!.clubId,
    );
    success(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
