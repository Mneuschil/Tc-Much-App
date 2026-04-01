import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createChallengeSchema, reportResultSchema } from '@tennis-club/shared';

const router = Router();

router.use(requireAuth);

// GET / – Rangliste des Vereins abrufen
router.get('/', (_req: Request, _res: Response) => {
  throw new Error('Not implemented');
});

// POST /challenge – Herausforderung senden
router.post('/challenge', validate(createChallengeSchema), (_req: Request, _res: Response) => {
  throw new Error('Not implemented');
});

// PUT /challenge/:challengeId/accept – Herausforderung annehmen
router.put('/challenge/:challengeId/accept', (_req: Request, _res: Response) => {
  throw new Error('Not implemented');
});

// PUT /challenge/:challengeId/decline – Herausforderung ablehnen
router.put('/challenge/:challengeId/decline', (_req: Request, _res: Response) => {
  throw new Error('Not implemented');
});

// POST /challenge/:challengeId/result – Ergebnis melden
router.post('/challenge/:challengeId/result', validate(reportResultSchema), (_req: Request, _res: Response) => {
  throw new Error('Not implemented');
});

// GET /challenges – Eigene Herausforderungen anzeigen
router.get('/challenges', (_req: Request, _res: Response) => {
  throw new Error('Not implemented');
});

export default router;
