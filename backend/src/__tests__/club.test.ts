import request from 'supertest';
import { prisma } from '../config/database';
import app from '../app';
import { hashPassword, generateAccessToken } from '../services/auth.service';
import type { TokenPayload, UserRole } from '@tennis-club/shared';

let adminToken: string;
let memberToken: string;
let systemAdminToken: string;
let clubId: string;
let testClubId: string;

beforeAll(async () => {
  // Create a base club + users for auth
  const club = await prisma.club.upsert({
    where: { clubCode: 'CLUBTEST' },
    update: {},
    create: { name: 'Club Test e.V.', clubCode: 'CLUBTEST', primaryColor: '#023320', secondaryColor: '#0EA65A' },
  });
  clubId = club.id;

  const passwordHash = await hashPassword('password123');

  const adminUser = await prisma.user.create({
    data: {
      email: 'clubadmin@test.de', passwordHash, firstName: 'Club', lastName: 'Admin', clubId,
      roles: { create: [{ role: 'CLUB_ADMIN', clubId }, { role: 'MEMBER', clubId }] },
    },
  });

  const memberUser = await prisma.user.create({
    data: {
      email: 'clubmember@test.de', passwordHash, firstName: 'Club', lastName: 'Member', clubId,
      roles: { create: [{ role: 'MEMBER', clubId }] },
    },
  });

  const sysAdminUser = await prisma.user.create({
    data: {
      email: 'sysadmin@test.de', passwordHash, firstName: 'Sys', lastName: 'Admin', clubId,
      roles: { create: [{ role: 'SYSTEM_ADMIN', clubId }] },
    },
  });

  const adminPayload: TokenPayload = { userId: adminUser.id, clubId, roles: ['CLUB_ADMIN', 'MEMBER'] as UserRole[] };
  const memberPayload: TokenPayload = { userId: memberUser.id, clubId, roles: ['MEMBER'] as UserRole[] };
  const sysPayload: TokenPayload = { userId: sysAdminUser.id, clubId, roles: ['SYSTEM_ADMIN'] as UserRole[] };

  adminToken = generateAccessToken(adminPayload);
  memberToken = generateAccessToken(memberPayload);
  systemAdminToken = generateAccessToken(sysPayload);
});

afterAll(async () => {
  // Cleanup
  if (testClubId) {
    await prisma.user.deleteMany({ where: { clubId: testClubId } });
    await prisma.club.deleteMany({ where: { id: testClubId } });
  }
  await prisma.userRoleAssignment.deleteMany({ where: { clubId } });
  await prisma.refreshToken.deleteMany({ where: { user: { clubId } } });
  await prisma.user.deleteMany({ where: { clubId } });
  await prisma.club.deleteMany({ where: { clubCode: 'CLUBTEST' } });
  await prisma.club.deleteMany({ where: { clubCode: 'NEWCLUB01' } });
  await prisma.$disconnect();
});

// ─── AC-01: POST /clubs creates club (SYSTEM_ADMIN only) ───────────
describe('POST /api/v1/clubs', () => {
  it('creates club with correct data – only SYSTEM_ADMIN (AC-01)', async () => {
    const res = await request(app)
      .post('/api/v1/clubs')
      .set('Authorization', `Bearer ${systemAdminToken}`)
      .send({
        name: 'Neuer TC',
        clubCode: 'NEWCLUB01',
        primaryColor: '#FF0000',
        secondaryColor: '#00FF00',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Neuer TC');
    expect(res.body.data.clubCode).toBe('NEWCLUB01');
    expect(res.body.data.primaryColor).toBe('#FF0000');
    testClubId = res.body.data.id;
  });

  it('rejects create from CLUB_ADMIN (not SYSTEM_ADMIN)', async () => {
    const res = await request(app)
      .post('/api/v1/clubs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Fail', clubCode: 'FAILCODE' });

    expect(res.status).toBe(403);
  });

  // ─── AC-05: Duplicate club code gives 409 ────────────────────────
  it('rejects duplicate clubCode with 409 (AC-05)', async () => {
    const res = await request(app)
      .post('/api/v1/clubs')
      .set('Authorization', `Bearer ${systemAdminToken}`)
      .send({ name: 'Duplicate', clubCode: 'NEWCLUB01' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

// ─── AC-02: GET /clubs/:id returns club details ────────────────────
describe('GET /api/v1/clubs/:clubId', () => {
  it('returns club details (AC-02)', async () => {
    const res = await request(app)
      .get(`/api/v1/clubs/${clubId}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Club Test e.V.');
    expect(res.body.data.clubCode).toBe('CLUBTEST');
    expect(res.body.data.primaryColor).toBe('#023320');
  });
});

// ─── AC-03: PUT /clubs/:id updates club – CLUB_ADMIN only ─────────
describe('PUT /api/v1/clubs/:clubId', () => {
  it('updates club data – CLUB_ADMIN (AC-03)', async () => {
    const res = await request(app)
      .put(`/api/v1/clubs/${clubId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Club Test Updated' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Club Test Updated');
  });

  it('rejects update from MEMBER', async () => {
    const res = await request(app)
      .put(`/api/v1/clubs/${clubId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Hacked' });

    expect(res.status).toBe(403);
  });
});

// ─── AC-04: POST /clubs/verify-code validates code ─────────────────
describe('POST /api/v1/clubs/verify-code', () => {
  it('validates clubCode and returns clubId + clubName (AC-04)', async () => {
    const res = await request(app)
      .post('/api/v1/clubs/verify-code')
      .send({ clubCode: 'CLUBTEST' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(clubId);
    expect(res.body.data.name).toBeDefined();
  });

  it('rejects invalid code with 404', async () => {
    const res = await request(app)
      .post('/api/v1/clubs/verify-code')
      .send({ clubCode: 'DOESNOTEXIST' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ─── AC-06 to AC-09: Seed data checks ──────────────────────────────
describe('Seed Data Verification', () => {
  let seedToken: string;
  let seedClubId: string;

  beforeAll(async () => {
    // Use the seeded TC Much club
    const club = await prisma.club.findUnique({ where: { clubCode: 'TCM026' } });
    if (!club) return;
    seedClubId = club.id;

    const adminUser = await prisma.user.findFirst({
      where: { clubId: seedClubId, roles: { some: { role: 'CLUB_ADMIN' } } },
    });
    if (adminUser) {
      seedToken = generateAccessToken({
        userId: adminUser.id,
        clubId: seedClubId,
        roles: ['CLUB_ADMIN', 'MEMBER'] as UserRole[],
      });
    }
  });

  // ─── AC-06: TC Much colors ────────────────────────────────────────
  it('TC Much has correct colors (AC-06)', async () => {
    const club = await prisma.club.findUnique({ where: { clubCode: 'TCM026' } });
    expect(club).not.toBeNull();
    expect(club!.name).toBe('TC Much e.V.');
    expect(club!.primaryColor).toBe('#023320');
    expect(club!.secondaryColor).toBe('#0EA65A');
  });

  // ─── AC-07: Admin + Sportwart + 5 Members ────────────────────────
  it('has Admin, Sportwart and at least 5 Members (AC-07)', async () => {
    const users = await prisma.user.findMany({
      where: { clubId: seedClubId },
      include: { roles: true },
    });

    const admins = users.filter(u => u.roles.some(r => r.role === 'CLUB_ADMIN'));
    const boards = users.filter(u => u.roles.some(r => r.role === 'BOARD_MEMBER'));
    const members = users.filter(u => u.roles.some(r => r.role === 'MEMBER'));

    expect(admins.length).toBeGreaterThanOrEqual(1);
    expect(boards.length).toBeGreaterThanOrEqual(1);
    expect(members.length).toBeGreaterThanOrEqual(5);
  });

  // ─── AC-08: Default channels ──────────────────────────────────────
  it('has default channels (AC-08)', async () => {
    const channels = await prisma.channel.findMany({
      where: { clubId: seedClubId, isDefault: true },
    });

    const names = channels.map(c => c.name);
    expect(names).toContain('Allgemein');
    expect(names).toContain('Turniere');
    expect(names).toContain('Jugend');
    expect(names).toContain('Training');
    expect(names).toContain('Vorstand');

    const restricted = channels.filter(c => c.visibility === 'RESTRICTED');
    expect(restricted.length).toBeGreaterThanOrEqual(3);
  });

  // ─── AC-09: 2 Teams with 6 players each ──────────────────────────
  it('has 2 match teams with 6 players each (AC-09)', async () => {
    const teams = await prisma.team.findMany({
      where: { clubId: seedClubId, type: 'MATCH_TEAM' },
      include: { _count: { select: { members: true } } },
    });

    expect(teams.length).toBe(2);
    for (const team of teams) {
      expect(team._count.members).toBe(6);
    }
  });
});
