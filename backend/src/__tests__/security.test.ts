import request from 'supertest';
import { prisma } from '../config/database';
import app from '../app';
import { hashPassword, generateAccessToken } from '../services/auth.service';
import type { UserRole } from '@tennis-club/shared';

/**
 * Security tests for:
 * - C-01: Webhook authentication
 * - C-02: Login tenant isolation
 * - C-03: Push token validation
 * - Arch #4: Cross-tenant data access prevention (matchResult + lineup)
 */

const CLUB_A_CODE = 'SECCLUBA';
const CLUB_B_CODE = 'SECCLUBB';
let clubAId: string;
let clubBId: string;
let userAId: string;
let userBId: string;
let boardAId: string;
let tokenA: string;
let tokenB: string;
let boardAToken: string;
let eventAId: string;
let eventBId: string;
let teamAId: string;
let teamBId: string;

beforeAll(async () => {
  const passwordHash = await hashPassword('password123');

  const clubA = await prisma.club.create({
    data: { name: 'Security Club A', clubCode: CLUB_A_CODE },
  });
  const clubB = await prisma.club.create({
    data: { name: 'Security Club B', clubCode: CLUB_B_CODE },
  });
  clubAId = clubA.id;
  clubBId = clubB.id;

  const userA = await prisma.user.create({
    data: {
      email: 'secuser@test.de',
      passwordHash,
      firstName: 'Sec',
      lastName: 'UserA',
      clubId: clubAId,
      roles: { create: [{ role: 'MEMBER', clubId: clubAId }] },
    },
  });
  userAId = userA.id;

  const boardA = await prisma.user.create({
    data: {
      email: 'secboard@test.de',
      passwordHash,
      firstName: 'Board',
      lastName: 'UserA',
      clubId: clubAId,
      roles: {
        create: [
          { role: 'BOARD_MEMBER', clubId: clubAId },
          { role: 'MEMBER', clubId: clubAId },
        ],
      },
    },
  });
  boardAId = boardA.id;

  const userB = await prisma.user.create({
    data: {
      email: 'secuser@test.de',
      passwordHash,
      firstName: 'Sec',
      lastName: 'UserB',
      clubId: clubBId,
      roles: { create: [{ role: 'MEMBER', clubId: clubBId }] },
    },
  });
  userBId = userB.id;

  tokenA = generateAccessToken({
    userId: userAId,
    clubId: clubAId,
    roles: ['MEMBER'] as UserRole[],
  });
  tokenB = generateAccessToken({
    userId: userBId,
    clubId: clubBId,
    roles: ['MEMBER'] as UserRole[],
  });
  boardAToken = generateAccessToken({
    userId: boardAId,
    clubId: clubAId,
    roles: ['BOARD_MEMBER', 'MEMBER'] as UserRole[],
  });

  // Create teams
  const teamA = await prisma.team.create({
    data: { name: 'Team A', type: 'MATCH_TEAM', clubId: clubAId },
  });
  const teamB = await prisma.team.create({
    data: { name: 'Team B', type: 'MATCH_TEAM', clubId: clubBId },
  });
  teamAId = teamA.id;
  teamBId = teamB.id;

  await prisma.teamMember.createMany({
    data: [
      { teamId: teamAId, userId: userAId, position: 1 },
      { teamId: teamAId, userId: boardAId, position: 2 },
      { teamId: teamBId, userId: userBId, position: 1 },
    ],
  });

  // Create events
  const eventA = await prisma.event.create({
    data: {
      title: 'Club A Match',
      type: 'LEAGUE_MATCH',
      startDate: new Date('2026-07-15T14:00:00Z'),
      teamId: teamAId,
      clubId: clubAId,
      createdById: userAId,
    },
  });
  const eventB = await prisma.event.create({
    data: {
      title: 'Club B Match',
      type: 'LEAGUE_MATCH',
      startDate: new Date('2026-07-15T14:00:00Z'),
      teamId: teamBId,
      clubId: clubBId,
      createdById: userBId,
    },
  });
  eventAId = eventA.id;
  eventBId = eventB.id;
});

afterAll(async () => {
  await prisma.matchResult.deleteMany({ where: { event: { clubId: { in: [clubAId, clubBId] } } } });
  await prisma.matchLineup.deleteMany({ where: { event: { clubId: { in: [clubAId, clubBId] } } } });
  await prisma.event.deleteMany({ where: { clubId: { in: [clubAId, clubBId] } } });
  await prisma.teamMember.deleteMany({ where: { team: { clubId: { in: [clubAId, clubBId] } } } });
  await prisma.team.deleteMany({ where: { clubId: { in: [clubAId, clubBId] } } });
  await prisma.pushToken.deleteMany({ where: { user: { clubId: { in: [clubAId, clubBId] } } } });
  await prisma.userRoleAssignment.deleteMany({ where: { clubId: { in: [clubAId, clubBId] } } });
  await prisma.refreshToken.deleteMany({ where: { user: { clubId: { in: [clubAId, clubBId] } } } });
  await prisma.user.deleteMany({ where: { clubId: { in: [clubAId, clubBId] } } });
  await prisma.club.deleteMany({ where: { clubCode: { in: [CLUB_A_CODE, CLUB_B_CODE] } } });
  await prisma.$disconnect();
});

// ═══════════════════════════════════════════════════════════════════
// C-01: Webhook Authentication
// ═══════════════════════════════════════════════════════════════════

describe('C-01: Webhook Authentication', () => {
  it('rejects webhook request without authorization header', async () => {
    const res = await request(app).post('/api/v1/webhooks/ranking-auto-accept');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects webhook request with invalid secret', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/ranking-auto-accept')
      .set('Authorization', 'Bearer wrong-secret-value');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('rejects training-reminder webhook without auth', async () => {
    const res = await request(app).post('/api/v1/webhooks/training-reminder');
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════
// C-02: Login Tenant Isolation
// ═══════════════════════════════════════════════════════════════════

describe('C-02: Login Tenant Isolation', () => {
  it('login requires clubCode parameter', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'secuser@test.de', password: 'password123' });

    expect(res.status).toBe(400);
  });

  it('login with correct clubCode returns correct user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'secuser@test.de', password: 'password123', clubCode: CLUB_A_CODE });

    expect(res.status).toBe(200);
    expect(res.body.data.user.clubId).toBe(clubAId);
    expect(res.body.data.user.lastName).toBe('UserA');
  });

  it('same email with different clubCode returns different user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'secuser@test.de', password: 'password123', clubCode: CLUB_B_CODE });

    expect(res.status).toBe(200);
    expect(res.body.data.user.clubId).toBe(clubBId);
    expect(res.body.data.user.lastName).toBe('UserB');
  });

  it('login with invalid clubCode returns 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'secuser@test.de', password: 'password123', clubCode: 'INVALID' });

    expect(res.status).toBe(400);
  });

  it('login with wrong password returns 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'secuser@test.de', password: 'wrongpassword', clubCode: CLUB_A_CODE });

    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════
// C-03: Push Token Validation
// ═══════════════════════════════════════════════════════════════════

describe('C-03: Push Token Validation', () => {
  afterEach(async () => {
    await prisma.pushToken.deleteMany({ where: { user: { clubId: clubAId } } });
  });

  it('rejects missing token field', async () => {
    const res = await request(app)
      .post('/api/v1/push')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ platform: 'IOS' });

    expect(res.status).toBe(400);
  });

  it('rejects empty token field', async () => {
    const res = await request(app)
      .post('/api/v1/push')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ token: '', platform: 'IOS' });

    expect(res.status).toBe(400);
  });

  it('rejects invalid platform', async () => {
    const res = await request(app)
      .post('/api/v1/push')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ token: 'ExponentPushToken[test123]', platform: 'WINDOWS' });

    expect(res.status).toBe(400);
  });

  it('rejects missing platform field', async () => {
    const res = await request(app)
      .post('/api/v1/push')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ token: 'ExponentPushToken[test123]' });

    expect(res.status).toBe(400);
  });

  it('accepts valid push token with IOS platform', async () => {
    const res = await request(app)
      .post('/api/v1/push')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ token: 'ExponentPushToken[sec-test-ios]', platform: 'IOS' });

    expect(res.status).toBe(201);
  });

  it('accepts valid push token with ANDROID platform', async () => {
    const res = await request(app)
      .post('/api/v1/push')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ token: 'ExponentPushToken[sec-test-android]', platform: 'ANDROID' });

    expect(res.status).toBe(201);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Arch #4: Cross-Tenant Data Access Prevention
// ═══════════════════════════════════════════════════════════════════

describe('Arch #4: getMatchDetail cross-tenant isolation', () => {
  it('returns match detail for own club event', async () => {
    const res = await request(app)
      .get(`/api/v1/matches/${eventAId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(eventAId);
  });

  it('returns 404 for event from another club (no data leak)', async () => {
    const res = await request(app)
      .get(`/api/v1/matches/${eventBId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
  });
});

describe('Arch #4: getResultsForEvent cross-tenant isolation', () => {
  beforeAll(async () => {
    await prisma.matchResult.create({
      data: {
        eventId: eventBId,
        submittedById: userBId,
        status: 'SUBMITTED',
        sets: JSON.parse(
          JSON.stringify([{ games1: 6, games2: 3, tiebreak1: null, tiebreak2: null }]),
        ),
        winnerId: userBId,
      },
    });
  });

  afterAll(async () => {
    await prisma.matchResult.deleteMany({ where: { eventId: eventBId } });
  });

  it('returns empty results for event from another club', async () => {
    const res = await request(app)
      .get(`/api/v1/matches/results/event/${eventBId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

describe('Arch #4: confirmResult cross-tenant isolation', () => {
  let resultBId: string;

  beforeEach(async () => {
    const result = await prisma.matchResult.create({
      data: {
        eventId: eventBId,
        submittedById: userBId,
        status: 'SUBMITTED',
        sets: JSON.parse(
          JSON.stringify([{ games1: 6, games2: 3, tiebreak1: null, tiebreak2: null }]),
        ),
        winnerId: userBId,
      },
    });
    resultBId = result.id;
  });

  afterEach(async () => {
    await prisma.matchResult.deleteMany({ where: { eventId: eventBId } });
  });

  it('cannot confirm result from another club', async () => {
    const res = await request(app)
      .post(`/api/v1/matches/${eventBId}/result/confirm`)
      .set('Authorization', `Bearer ${tokenA}`);

    // Should fail — no pending result found for this club
    expect(res.status).toBe(400);
  });
});

describe('Arch #4: lineup cross-tenant isolation', () => {
  beforeAll(async () => {
    await prisma.matchLineup.createMany({
      data: [{ eventId: eventBId, teamId: teamBId, userId: userBId, position: 1 }],
    });
  });

  afterAll(async () => {
    await prisma.matchLineup.deleteMany({ where: { eventId: eventBId } });
  });

  it('getLineup returns empty for event from another club', async () => {
    const res = await request(app)
      .get(`/api/v1/matches/lineup/${eventBId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});
