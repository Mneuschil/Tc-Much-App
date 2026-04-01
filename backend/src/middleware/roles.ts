import { Request, Response, NextFunction } from 'express';
import { UserRole, ROLE_HIERARCHY } from '@tennis-club/shared';

// ─── Multi-Role Permission System (spec section 2) ─────────────────
// Rules:
// - Users can have multiple roles
// - Highest permission wins
// - Access is based on: role, team assignment, training group assignment

export function getHighestPermissionLevel(roles: UserRole[]): number {
  if (roles.length === 0) return 0;
  return Math.max(...roles.map((r) => ROLE_HIERARCHY[r]));
}

export function hasRole(roles: UserRole[], role: UserRole): boolean {
  return roles.includes(role);
}

export function hasAnyRole(roles: UserRole[], required: UserRole[]): boolean {
  return required.some((r) => roles.includes(r));
}

export function hasMinPermissionLevel(roles: UserRole[], minLevel: number): boolean {
  return getHighestPermissionLevel(roles) >= minLevel;
}

// Middleware: require at least one of the specified roles
export function requireAnyRole(requiredRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Nicht authentifiziert' },
      });
      return;
    }

    const userRoles = req.user.roles as UserRole[];

    if (!hasAnyRole(userRoles, requiredRoles)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Keine Berechtigung fuer diese Aktion' },
      });
      return;
    }

    next();
  };
}

// Middleware: require minimum permission level (highest permission wins)
export function requireMinPermission(minLevel: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Nicht authentifiziert' },
      });
      return;
    }

    const userRoles = req.user.roles as UserRole[];

    if (!hasMinPermissionLevel(userRoles, minLevel)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Keine Berechtigung fuer diese Aktion' },
      });
      return;
    }

    next();
  };
}

// Middleware: require board-level or higher (level 3+)
export const requireBoard = requireMinPermission(3);

// Middleware: require club admin or system admin (level 4+)
export const requireAdmin = requireMinPermission(4);

// Middleware: require system admin (level 5)
export const requireSystemAdmin = requireMinPermission(5);
