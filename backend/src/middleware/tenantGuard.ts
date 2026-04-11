import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';

/**
 * Ensures the authenticated user has a valid clubId (tenant context).
 * Injects req.tenantId for convenience in downstream handlers.
 */
export const requireTenant = asyncHandler(async (req, _res, next) => {
  if (!req.user?.clubId) {
    throw AppError.forbidden('Kein Club-Kontext vorhanden', 'TENANT_MISSING');
  }
  req.tenantId = req.user.clubId;
  next();
});
