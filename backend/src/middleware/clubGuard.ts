import { Request, Response, NextFunction } from 'express';

export function clubGuard(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Nicht authentifiziert' },
    });
    return;
  }

  const clubId = req.params.clubId || req.body?.clubId;

  if (clubId && clubId !== req.user.clubId) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Kein Zugriff auf diesen Verein' },
    });
    return;
  }

  next();
}
