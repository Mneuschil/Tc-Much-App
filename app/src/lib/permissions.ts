import { UserRole, ROLE_HIERARCHY } from '@tennis-club/shared';

// ─── Permission System (spec section 2) ─────────────────────────────
// - Users can have multiple roles
// - Highest permission wins
// - Access based on: role, team assignment, training group assignment

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

export function isBoard(roles: UserRole[]): boolean {
  return hasMinPermissionLevel(roles, 3);
}

export function isAdmin(roles: UserRole[]): boolean {
  return hasMinPermissionLevel(roles, 4);
}

export function isTrainer(roles: UserRole[]): boolean {
  return hasRole(roles, UserRole.TRAINER);
}

export function isTeamCaptain(roles: UserRole[]): boolean {
  return hasRole(roles, UserRole.TEAM_CAPTAIN);
}

export function canManageTeam(roles: UserRole[], isTeamCaptainForTeam: boolean): boolean {
  return isAdmin(roles) || isBoard(roles) || isTeamCaptainForTeam;
}

export function canCreateTodo(roles: UserRole[]): boolean {
  return hasAnyRole(roles, [
    UserRole.BOARD_MEMBER,
    UserRole.TRAINER,
    UserRole.TEAM_CAPTAIN,
    UserRole.CLUB_ADMIN,
    UserRole.SYSTEM_ADMIN,
  ]);
}

export function canCreateFolder(roles: UserRole[]): boolean {
  return isBoard(roles) || isAdmin(roles);
}
