import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { addDays, addMinutes } from 'date-fns';
import { prisma } from '../config/database';
import { env } from '../config/env';
import type { User, AuthTokens, TokenPayload, UserRole } from '@tennis-club/shared';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(
    { ...payload },
    env.JWT_ACCESS_SECRET,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { expiresIn: env.JWT_ACCESS_EXPIRY } as any,
  );
}

export function generateRefreshToken(): string {
  return randomUUID();
}

export function generateTokens(payload: TokenPayload): { accessToken: string; rawRefreshToken: string } {
  return {
    accessToken: generateAccessToken(payload),
    rawRefreshToken: generateRefreshToken(),
  };
}

function toUserResponse(dbUser: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  phone: string | null;
  clubId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  roles: { role: string }[];
}): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    avatarUrl: dbUser.avatarUrl,
    phone: dbUser.phone,
    clubId: dbUser.clubId,
    isActive: dbUser.isActive,
    roles: dbUser.roles.map((r) => r.role as UserRole),
    createdAt: dbUser.createdAt.toISOString(),
    updatedAt: dbUser.updatedAt.toISOString(),
  };
}

function parseExpiry(expiry: string): Date {
  const match = expiry.match(/^(\d+)([mhd])$/);
  if (!match) return addDays(new Date(), 30);

  const [, value, unit] = match;
  const num = parseInt(value!, 10);
  switch (unit) {
    case 'm': return addMinutes(new Date(), num);
    case 'h': return addMinutes(new Date(), num * 60);
    case 'd': return addDays(new Date(), num);
    default: return addDays(new Date(), 30);
  }
}

async function storeRefreshToken(userId: string, rawToken: string): Promise<void> {
  const hashedToken = await bcrypt.hash(rawToken, 10);
  await prisma.refreshToken.create({
    data: {
      token: hashedToken,
      userId,
      expiresAt: parseExpiry(env.JWT_REFRESH_EXPIRY),
    },
  });
}

export async function register(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  clubCode: string;
  phone?: string;
}): Promise<{ user: User; tokens: AuthTokens }> {
  const club = await prisma.club.findUnique({
    where: { clubCode: input.clubCode },
  });

  if (!club) {
    throw new AuthError('Ungueltiger Club-Code', 'INVALID_CLUB_CODE', 400);
  }

  const existing = await prisma.user.findUnique({
    where: { email_clubId: { email: input.email, clubId: club.id } },
  });

  if (existing) {
    throw new AuthError('E-Mail ist bereits registriert', 'EMAIL_EXISTS', 409);
  }

  const passwordHash = await hashPassword(input.password);

  // Create user with default MEMBER role
  const dbUser = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone ?? null,
      clubId: club.id,
      roles: {
        create: {
          clubId: club.id,
          role: 'MEMBER',
        },
      },
    },
    include: { roles: true },
  });

  const payload: TokenPayload = {
    userId: dbUser.id,
    clubId: dbUser.clubId,
    roles: dbUser.roles.map((r) => r.role as UserRole),
  };

  const { accessToken, rawRefreshToken } = generateTokens(payload);
  await storeRefreshToken(dbUser.id, rawRefreshToken);

  return {
    user: toUserResponse(dbUser),
    tokens: { accessToken, refreshToken: rawRefreshToken },
  };
}

export async function login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
  const dbUser = await prisma.user.findFirst({
    where: { email, isActive: true },
    include: { roles: true },
  });

  if (!dbUser) {
    throw new AuthError('Ungueltige Anmeldedaten', 'INVALID_CREDENTIALS', 401);
  }

  const valid = await comparePassword(password, dbUser.passwordHash);
  if (!valid) {
    throw new AuthError('Ungueltige Anmeldedaten', 'INVALID_CREDENTIALS', 401);
  }

  const payload: TokenPayload = {
    userId: dbUser.id,
    clubId: dbUser.clubId,
    roles: dbUser.roles.map((r) => r.role as UserRole),
  };

  const { accessToken, rawRefreshToken } = generateTokens(payload);
  await storeRefreshToken(dbUser.id, rawRefreshToken);

  return {
    user: toUserResponse(dbUser),
    tokens: { accessToken, refreshToken: rawRefreshToken },
  };
}

export async function refreshToken(token: string): Promise<{ tokens: AuthTokens; user: User }> {
  const storedTokens = await prisma.refreshToken.findMany({
    where: { expiresAt: { gt: new Date() } },
    include: { user: { include: { roles: true } } },
  });

  let matchedRecord: (typeof storedTokens)[number] | null = null;

  for (const record of storedTokens) {
    const isMatch = await bcrypt.compare(token, record.token);
    if (isMatch) {
      matchedRecord = record;
      break;
    }
  }

  if (!matchedRecord) {
    throw new AuthError('Ungueltiger oder abgelaufener Refresh-Token', 'INVALID_REFRESH_TOKEN', 401);
  }

  await prisma.refreshToken.delete({ where: { id: matchedRecord.id } });

  const dbUser = matchedRecord.user;
  if (!dbUser.isActive) {
    throw new AuthError('Konto ist deaktiviert', 'ACCOUNT_DISABLED', 403);
  }

  const payload: TokenPayload = {
    userId: dbUser.id,
    clubId: dbUser.clubId,
    roles: dbUser.roles.map((r) => r.role as UserRole),
  };

  const { accessToken, rawRefreshToken } = generateTokens(payload);
  await storeRefreshToken(dbUser.id, rawRefreshToken);

  return {
    tokens: { accessToken, refreshToken: rawRefreshToken },
    user: toUserResponse(dbUser),
  };
}

export async function logout(token: string): Promise<void> {
  const storedTokens = await prisma.refreshToken.findMany({
    where: { expiresAt: { gt: new Date() } },
  });

  for (const record of storedTokens) {
    const isMatch = await bcrypt.compare(token, record.token);
    if (isMatch) {
      await prisma.refreshToken.delete({ where: { id: record.id } });
      return;
    }
  }
}

export class AuthError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.statusCode = statusCode;
  }
}
