import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';
import { env } from '../config/env';

/**
 * Validates webhook requests from n8n via shared secret.
 * Expects: Authorization: Bearer <WEBHOOK_SECRET>
 */
export function requireWebhookAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing webhook authorization' },
    });
    return;
  }

  const token = authHeader.substring(7);
  const expected = env.WEBHOOK_SECRET;

  // Timing-safe comparison to prevent timing attacks
  const tokenBuf = Buffer.from(token);
  const expectedBuf = Buffer.from(expected);

  if (tokenBuf.length !== expectedBuf.length || !timingSafeEqual(tokenBuf, expectedBuf)) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Invalid webhook secret' },
    });
    return;
  }

  next();
}
