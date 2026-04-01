import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createChallengeSchema, reportResultSchema } from '@tennis-club/shared';
import { error } from '../utils/apiResponse';

const router = Router();

router.use(requireAuth);

// GET / – Rangliste des Vereins abrufen
router.get('/', (_req: Request, res: Response) => {
  error(res, 'Not yet implemented', 501, 'NOT_IMPLEMENTED');
});

// POST /challenge – Herausforderung senden
router.post('/challenge', validate(createChallengeSchema), (_req: Request, res: Response) => {
  error(res, 'Not yet implemented', 501, 'NOT_IMPLEMENTED');
});

// PUT /challenge/:challengeId/accept – Herausforderung annehmen
router.put('/challenge/:challengeId/accept', (_req: Request, res: Response) => {
  error(res, 'Not yet implemented', 501, 'NOT_IMPLEMENTED');
});

// PUT /challenge/:challengeId/decline – Herausforderung ablehnen
router.put('/challenge/:challengeId/decline', (_req: Request, res: Response) => {
  error(res, 'Not yet implemented', 501, 'NOT_IMPLEMENTED');
});

// POST /challenge/:challengeId/result – Ergebnis melden
router.post('/challenge/:challengeId/result', validate(reportResultSchema), (_req: Request, res: Response) => {
  error(res, 'Not yet implemented', 501, 'NOT_IMPLEMENTED');
});

// GET /challenges – Eigene Herausforderungen anzeigen
router.get('/challenges', (_req: Request, res: Response) => {
  error(res, 'Not yet implemented', 501, 'NOT_IMPLEMENTED');
});

export default router;
