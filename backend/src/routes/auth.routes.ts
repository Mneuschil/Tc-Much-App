import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, refreshTokenSchema } from '@tennis-club/shared';
import { authLimiter } from '../middleware/rateLimiter';
import * as authService from '../services/auth.service';
import { AuthError } from '../services/auth.service';
import { success, error } from '../utils/apiResponse';

const router = Router();

function handleAuthError(err: unknown, res: Response): void {
  if (err instanceof AuthError) {
    error(res, err.message, err.statusCode, err.code);
  } else {
    throw err;
  }
}

// POST /register – Registrierung mit Club-Code
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register(req.body);
      success(res, result, 201);
    } catch (err) {
      if (err instanceof AuthError) return handleAuthError(err, res);
      next(err);
    }
  }
);

// POST /login – Anmeldung mit E-Mail + Passwort
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      success(res, result);
    } catch (err) {
      if (err instanceof AuthError) return handleAuthError(err, res);
      next(err);
    }
  }
);

// POST /refresh – Access Token erneuern
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      success(res, result);
    } catch (err) {
      if (err instanceof AuthError) return handleAuthError(err, res);
      next(err);
    }
  }
);

// POST /logout – Refresh Token invalidieren
router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body ?? {};
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    success(res, { message: 'Erfolgreich abgemeldet' });
  } catch (err) {
    next(err);
  }
});

export default router;
