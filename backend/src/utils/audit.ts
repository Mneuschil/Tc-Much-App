import { logger } from './logger';

export function logAudit(
  action: string,
  userId: string,
  clubId: string,
  details?: Record<string, unknown>,
): void {
  logger.info(`AUDIT: ${action}`, {
    audit: true,
    action,
    userId,
    clubId,
    ...details,
  });
}
