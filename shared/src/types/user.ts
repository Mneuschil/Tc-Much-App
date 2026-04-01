// ─── User Roles (combinable, spec section 2) ───────────────────────

export enum UserRole {
  MEMBER = 'MEMBER',
  TRAINER = 'TRAINER',
  BOARD_MEMBER = 'BOARD_MEMBER',
  TEAM_CAPTAIN = 'TEAM_CAPTAIN',
  PARENT = 'PARENT',
  CLUB_ADMIN = 'CLUB_ADMIN',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
}

// Permission hierarchy: highest permission wins (spec: "Highest permission wins")
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.MEMBER]: 1,
  [UserRole.PARENT]: 1,
  [UserRole.TRAINER]: 2,
  [UserRole.TEAM_CAPTAIN]: 2,
  [UserRole.BOARD_MEMBER]: 3,
  [UserRole.CLUB_ADMIN]: 4,
  [UserRole.SYSTEM_ADMIN]: 5,
};

export interface UserRoleAssignment {
  id: string;
  userId: string;
  clubId: string;
  role: UserRole;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  phone: string | null;
  clubId: string;
  isActive: boolean;
  roles: UserRole[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  clubId: string;
  roles: UserRole[];
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}
