import request from 'supertest';
import { prisma } from '../config/database';
import app from '../app';
import { hashPassword, generateAccessToken } from '../services/auth.service';
import type { TokenPayload, UserRole } from '@tennis-club/shared';

const CLUB_CODE = 'USERTEST';
let clubId: string;
let otherClubId: string;
let adminUserId: string;
let memberUserId: string;
let otherClubUserId: string;
let adminToken: string;
let boardToken: string;
let memberToken: string;
let otherClubToken: string;

beforeAll(async () => {
  const passwordHash = await hashPassword('password123');

  const club = await prisma.club.create({ data: { name: 'User Test Club', clubCode: CLUB_CODE } });
  clubId = club.id;

  const otherClub = await prisma.club.create({
    data: { name: 'Other Club', clubCode: 'OTHERCLB' },
  });
  otherClubId = otherClub.id;

  const adminUser = await prisma.user.create({
    data: {
      email: 'useradmin@test.de',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      clubId,
      roles: {
        create: [
          { role: 'CLUB_ADMIN', clubId },
          { role: 'MEMBER', clubId },
        ],
      },
    },
  });
  adminUserId = adminUser.id;

  const boardUser = await prisma.user.create({
    data: {
      email: 'userboard@test.de',
      passwordHash,
      firstName: 'Board',
      lastName: 'User',
      clubId,
      roles: {
        create: [
          { role: 'BOARD_MEMBER', clubId },
          { role: 'MEMBER', clubId },
        ],
      },
    },
  });

  const memberUser = await prisma.user.create({
    data: {
      email: 'usermember@test.de',
      passwordHash,
      firstName: 'Member',
      lastName: 'User',
      clubId,
      roles: { create: [{ role: 'MEMBER', clubId }] },
    },
  });
  memberUserId = memberUser.id;

  const trainerUser = await prisma.user.create({
    data: {
      email: 'usertrainer@test.de',
      passwordHash,
      firstName: 'Trainer',
      lastName: 'User',
      clubId,
      roles: {
        create: [
          { role: 'TRAINER', clubId },
          { role: 'MEMBER', clubId },
        ],
      },
    },
  });

  const otherUser = await prisma.user.create({
    data: {
      email: 'other@otherclub.de',
      passwordHash,
      firstName: 'Other',
      lastName: 'Club',
      clubId: otherClubId,
      roles: { create: [{ role: 'MEMBER', clubId: otherClubId }] },
    },
  });
  otherClubUserId = otherUser.id;

  adminToken = generateAccessToken({
    userId: adminUser.id,
    clubId,
    roles: ['CLUB_ADMIN', 'MEMBER'] as UserRole[],
  });
  boardToken = generateAccessToken({
    userId: boardUser.id,
    clubId,
    roles: ['BOARD_MEMBER', 'MEMBER'] as UserRole[],
  });
  memberToken = generateAccessToken({
    userId: memberUser.id,
    clubId,
    roles: ['MEMBER'] as UserRole[],
  });
  otherClubToken = generateAccessToken({
    userId: otherUser.id,
    clubId: otherClubId,
    roles: ['MEMBER'] as UserRole[],
  });
});

afterAll(async () => {
  await prisma.userRoleAssignment.deleteMany({ where: { clubId: { in: [clubId, otherClubId] } } });
  await prisma.refreshToken.deleteMany({
    where: { user: { clubId: { in: [clubId, otherClubId] } } },
  });
  await prisma.user.deleteMany({ where: { clubId: { in: [clubId, otherClubId] } } });
  await prisma.club.deleteMany({ where: { clubCode: { in: [CLUB_CODE, 'OTHERCLB'] } } });
  await prisma.$disconnect();
});

// AC-01: GET /users/me
describe('GET /api/v1/users/me', () => {
  it('returns own profile with roles array (AC-01)', async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('usermember@test.de');
    expect(res.body.data.roles).toContain('MEMBER');
    expect(res.body.data.passwordHash).toBeUndefined();
  });
});

// AC-02: PUT /users/me
describe('PUT /api/v1/users/me', () => {
  it('updates own profile fields (AC-02)', async () => {
    const res = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ firstName: 'Updated', phone: '+49 123 456' });

    expect(res.status).toBe(200);
    expect(res.body.data.firstName).toBe('Updated');
    expect(res.body.data.phone).toBe('+49 123 456');
  });
});

// AC-03: GET /users (CLUB_ADMIN/BOARD_MEMBER only)
describe('GET /api/v1/users', () => {
  it('lists club members for BOARD_MEMBER with pagination (AC-03, H-01)', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${boardToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(4);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(4);
    // All users should belong to same club
    for (const user of res.body.data) {
      expect(user.clubId).toBe(clubId);
    }
  });

  it('respects page and limit query params (H-01)', async () => {
    const res = await request(app)
      .get('/api/v1/users?page=1&limit=2')
      .set('Authorization', `Bearer ${boardToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.pagination.limit).toBe(2);
    expect(res.body.pagination.totalPages).toBeGreaterThanOrEqual(2);
  });

  it('rejects MEMBER from listing users', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(403);
  });

  // AC-04: Filter by role
  it('filters by role with pagination (AC-04)', async () => {
    const res = await request(app)
      .get('/api/v1/users?role=TRAINER')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].roles).toContain('TRAINER');
    expect(res.body.pagination.total).toBe(1);
  });
});

// AC-05: GET /users/:id
describe('GET /api/v1/users/:id', () => {
  it('returns profile for same-club user (AC-05)', async () => {
    const res = await request(app)
      .get(`/api/v1/users/${memberUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(memberUserId);
  });

  // AC-06: Multi-tenant isolation
  it('rejects access to other club user (AC-06)', async () => {
    const res = await request(app)
      .get(`/api/v1/users/${otherClubUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
  });
});

// AC-07: PUT /users/:id/roles
describe('PUT /api/v1/users/:id/roles', () => {
  it('sets roles as CLUB_ADMIN (AC-07)', async () => {
    const res = await request(app)
      .put(`/api/v1/users/${memberUserId}/roles`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roles: ['MEMBER', 'TRAINER'] });

    expect(res.status).toBe(200);
    expect(res.body.data.roles).toContain('MEMBER');
    expect(res.body.data.roles).toContain('TRAINER');

    // Reset
    await request(app)
      .put(`/api/v1/users/${memberUserId}/roles`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roles: ['MEMBER'] });
  });

  it('rejects from non-CLUB_ADMIN', async () => {
    const res = await request(app)
      .put(`/api/v1/users/${memberUserId}/roles`)
      .set('Authorization', `Bearer ${boardToken}`)
      .send({ roles: ['MEMBER', 'TRAINER'] });

    expect(res.status).toBe(403);
  });

  // AC-08: Cannot remove own admin role
  it('prevents removing own CLUB_ADMIN role (AC-08)', async () => {
    const res = await request(app)
      .put(`/api/v1/users/${adminUserId}/roles`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roles: ['MEMBER'] });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CANNOT_REMOVE_OWN_ADMIN');
  });
});
