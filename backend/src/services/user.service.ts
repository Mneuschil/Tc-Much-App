import { prisma } from '../config/database';
import type { UpdateProfileInput, UserRole } from '@tennis-club/shared';

export class UserError extends Error {
  code: string;
  statusCode: number;
  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = 'UserError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  phone: true,
  clubId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  roles: { select: { role: true } },
} as const;

function formatUser(dbUser: { roles: { role: string }[] } & Record<string, unknown>) {
  const { roles, ...rest } = dbUser;
  return { ...rest, roles: roles.map((r: { role: string }) => r.role) };
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SELECT,
  });
  if (!user) throw new UserError('User nicht gefunden', 'USER_NOT_FOUND', 404);
  return formatUser(user);
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
    },
    select: USER_SELECT,
  });
  return formatUser(user);
}

export async function getClubMembers(clubId: string, roleFilter?: string, page = 1, limit = 50) {
  const where = {
    clubId,
    isActive: true,
    ...(roleFilter ? { roles: { some: { role: roleFilter as UserRole } } } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: USER_SELECT,
      orderBy: { lastName: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { users: users.map(formatUser), total };
}

export async function getUserById(userId: string, requestingClubId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SELECT,
  });
  if (!user) throw new UserError('User nicht gefunden', 'USER_NOT_FOUND', 404);
  if (user.clubId !== requestingClubId) {
    throw new UserError('Kein Zugriff auf diesen User', 'FORBIDDEN', 403);
  }
  return formatUser(user);
}

export async function updateUserRoles(
  targetUserId: string,
  newRoles: UserRole[],
  requestingUserId: string,
  clubId: string,
) {
  // Verify target user belongs to same club
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { roles: true },
  });
  if (!targetUser || targetUser.clubId !== clubId) {
    throw new UserError('User nicht gefunden', 'USER_NOT_FOUND', 404);
  }

  // Prevent CLUB_ADMIN from removing own CLUB_ADMIN role
  if (targetUserId === requestingUserId) {
    const hadAdmin = targetUser.roles.some((r) => r.role === 'CLUB_ADMIN');
    const stillHasAdmin = newRoles.includes('CLUB_ADMIN' as UserRole);
    if (hadAdmin && !stillHasAdmin) {
      throw new UserError(
        'Du kannst dir selbst nicht die Admin-Rolle entziehen',
        'CANNOT_REMOVE_OWN_ADMIN',
        400,
      );
    }
  }

  // Replace all roles
  await prisma.userRoleAssignment.deleteMany({ where: { userId: targetUserId } });
  await prisma.userRoleAssignment.createMany({
    data: newRoles.map((role) => ({ userId: targetUserId, clubId, role })),
  });

  return getProfile(targetUserId);
}
