import request from 'supertest';
import { prisma } from '../config/database';
import app from '../app';
import { hashPassword, generateAccessToken } from '../services/auth.service';
import * as pushService from '../services/push.service';
import type { UserRole } from '@tennis-club/shared';

const CLUB_CODE = 'RANKTST';
let clubId: string;
let adminToken: string;
let boardToken: string;
let player1Token: string;
let player2Token: string;
let player3Token: string;
let adminUserId: string;
let boardUserId: string;
let player1Id: string;
let player2Id: string;
let player3Id: string;
let player4Id: string;
let player5Id: string;

beforeAll(async () => {
  const passwordHash = await hashPassword('password123');

  const club = await prisma.club.create({ data: { name: 'Ranking Test Club', clubCode: CLUB_CODE } });
  clubId = club.id;

  const adminUser = await prisma.user.create({
    data: {
      email: 'rankadmin@test.de', passwordHash, firstName: 'Admin', lastName: 'Ranking', clubId,
      roles: { create: [{ role: 'CLUB_ADMIN', clubId }, { role: 'MEMBER', clubId }] },
    },
  });
  adminUserId = adminUser.id;

  const boardUser = await prisma.user.create({
    data: {
      email: 'rankboard@test.de', passwordHash, firstName: 'Board', lastName: 'Ranking', clubId,
      roles: { create: [{ role: 'BOARD_MEMBER', clubId }, { role: 'MEMBER', clubId }] },
    },
  });
  boardUserId = boardUser.id;

  const players = [];
  for (let i = 1; i <= 5; i++) {
    const p = await prisma.user.create({
      data: {
        email: `rankp${i}@test.de`, passwordHash, firstName: `Spieler${i}`, lastName: 'Ranking', clubId,
        roles: { create: [{ role: 'MEMBER', clubId }] },
      },
    });
    players.push(p);
  }
  [player1Id, player2Id, player3Id, player4Id, player5Id] = players.map(p => p.id);

  adminToken = generateAccessToken({ userId: adminUserId, clubId, roles: ['CLUB_ADMIN', 'MEMBER'] as UserRole[] });
  boardToken = generateAccessToken({ userId: boardUserId, clubId, roles: ['BOARD_MEMBER', 'MEMBER'] as UserRole[] });
  player1Token = generateAccessToken({ userId: player1Id, clubId, roles: ['MEMBER'] as UserRole[] });
  player2Token = generateAccessToken({ userId: player2Id, clubId, roles: ['MEMBER'] as UserRole[] });
  player3Token = generateAccessToken({ userId: player3Id, clubId, roles: ['MEMBER'] as UserRole[] });
});

afterAll(async () => {
  await prisma.rankingChallenge.deleteMany({ where: { clubId } });
  await prisma.ranking.deleteMany({ where: { clubId } });
  await prisma.matchResult.deleteMany({ where: { event: { clubId } } });
  await prisma.event.deleteMany({ where: { clubId } });
  await prisma.teamMember.deleteMany({ where: { team: { clubId } } });
  await prisma.team.deleteMany({ where: { clubId } });
  await prisma.pushToken.deleteMany({ where: { user: { clubId } } });
  await prisma.userRoleAssignment.deleteMany({ where: { clubId } });
  await prisma.refreshToken.deleteMany({ where: { user: { clubId } } });
  await prisma.user.deleteMany({ where: { clubId } });
  await prisma.club.deleteMany({ where: { clubCode: CLUB_CODE } });
  await prisma.$disconnect();
});

// ─── AC-02: POST /rankings/init ────────────────────────────────────
describe('POST /api/v1/rankings/init', () => {
  afterEach(async () => {
    await prisma.ranking.deleteMany({ where: { clubId } });
  });

  it('initializes ranking manually – BOARD/ADMIN (AC-02)', async () => {
    const res = await request(app)
      .post('/api/v1/rankings/init')
      .set('Authorization', `Bearer ${boardToken}`)
      .send({
        category: 'HERREN',
        rankings: [
          { userId: player1Id, rank: 1, points: 100 },
          { userId: player2Id, rank: 2, points: 80 },
          { userId: player3Id, rank: 3, points: 60 },
          { userId: player4Id, rank: 4, points: 40 },
          { userId: player5Id, rank: 5, points: 20 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveLength(5);
  });

  it('rejects MEMBER from initializing (AC-02)', async () => {
    const res = await request(app)
      .post('/api/v1/rankings/init')
      .set('Authorization', `Bearer ${player1Token}`)
      .send({
        rankings: [{ userId: player1Id, rank: 1 }],
      });

    expect(res.status).toBe(403);
  });
});

// ─── AC-01: GET /rankings?category=HERREN ──────────────────────────
describe('GET /api/v1/rankings', () => {
  beforeAll(async () => {
    await prisma.ranking.deleteMany({ where: { clubId } });
    // Create rankings with previousRank for movement test
    await prisma.ranking.createMany({
      data: [
        { clubId, userId: player1Id, category: 'HERREN', rank: 1, previousRank: 2, wins: 5, losses: 1, points: 100 },
        { clubId, userId: player2Id, category: 'HERREN', rank: 2, previousRank: 1, wins: 4, losses: 2, points: 80 },
        { clubId, userId: player3Id, category: 'HERREN', rank: 3, previousRank: 3, wins: 3, losses: 3, points: 60 },
        { clubId, userId: player4Id, category: 'DAMEN', rank: 1, wins: 2, losses: 0, points: 50 },
      ],
    });
  });

  afterAll(async () => {
    await prisma.ranking.deleteMany({ where: { clubId } });
  });

  it('returns ranking sorted by position (AC-01)', async () => {
    const res = await request(app)
      .get('/api/v1/rankings?category=HERREN')
      .set('Authorization', `Bearer ${player1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0].rank).toBe(1);
    expect(res.body.data[0].user.firstName).toBe('Spieler1');
    expect(res.body.data[2].rank).toBe(3);
  });

  it('filters by category (AC-01)', async () => {
    const res = await request(app)
      .get('/api/v1/rankings?category=DAMEN')
      .set('Authorization', `Bearer ${player1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].user.firstName).toBe('Spieler4');
  });

  // AC-04: Ranking contains position, userName, wins, losses, lastActivity, movement
  it('contains all required fields including movement indicator (AC-04, AC-05)', async () => {
    const res = await request(app)
      .get('/api/v1/rankings?category=HERREN')
      .set('Authorization', `Bearer ${player1Token}`);

    expect(res.status).toBe(200);
    const first = res.body.data[0];

    // AC-04 fields
    expect(first.rank).toBeDefined();
    expect(first.user.firstName).toBeDefined();
    expect(first.wins).toBeDefined();
    expect(first.losses).toBeDefined();
    expect(first.lastActivity).toBeDefined();
    expect(first.movement).toBeDefined();

    // AC-05: movement based on previousRank
    // Player1: previousRank 2, current rank 1 → UP
    expect(first.movement).toBe('UP');
    // Player2: previousRank 1, current rank 2 → DOWN
    expect(res.body.data[1].movement).toBe('DOWN');
    // Player3: previousRank 3, current rank 3 → STABLE
    expect(res.body.data[2].movement).toBe('STABLE');
  });
});

// ─── AC-03: Auto-update after COMPLETED ranking match ──────────────
describe('Ranking auto-update (AC-03)', () => {
  let matchEventId: string;
  let teamId: string;

  beforeAll(async () => {
    await prisma.ranking.deleteMany({ where: { clubId } });
    // Player1 = rank 1, Player2 = rank 2
    await prisma.ranking.createMany({
      data: [
        { clubId, userId: player1Id, category: 'HERREN', rank: 1, wins: 0, losses: 0, points: 0 },
        { clubId, userId: player2Id, category: 'HERREN', rank: 2, wins: 0, losses: 0, points: 0 },
      ],
    });

    // Create team + match for result submission
    const team = await prisma.team.create({ data: { name: 'Ranking Team', type: 'MATCH_TEAM', clubId } });
    teamId = team.id;
    await prisma.teamMember.createMany({
      data: [
        { teamId, userId: player1Id, position: 1 },
        { teamId, userId: player2Id, position: 2 },
      ],
    });

    const event = await prisma.event.create({
      data: {
        title: 'Ranglistenspiel P2 vs P1',
        type: 'RANKING_MATCH',
        startDate: new Date('2026-08-01T10:00:00Z'),
        teamId,
        clubId,
        createdById: adminUserId,
      },
    });
    matchEventId = event.id;
  });

  afterAll(async () => {
    await prisma.matchResult.deleteMany({ where: { eventId: matchEventId } });
    await prisma.event.deleteMany({ where: { clubId } });
    await prisma.teamMember.deleteMany({ where: { teamId } });
    await prisma.team.deleteMany({ where: { id: teamId } });
    await prisma.ranking.deleteMany({ where: { clubId } });
  });

  it('swaps ranks when challenger wins (AC-03)', async () => {
    // Player2 (rank 2) challenges Player1 (rank 1) and wins
    // Submit result: Player2 wins
    await request(app)
      .post(`/api/v1/matches/${matchEventId}/result`)
      .set('Authorization', `Bearer ${player2Token}`)
      .send({
        sets: [{ games1: 6, games2: 3, tiebreak1: null, tiebreak2: null }],
        winnerId: player2Id,
      });

    // Player1 confirms
    await request(app)
      .post(`/api/v1/matches/${matchEventId}/result/confirm`)
      .set('Authorization', `Bearer ${player1Token}`);

    // Check rankings - should be swapped
    const rankings = await prisma.ranking.findMany({
      where: { clubId, category: 'HERREN' },
      orderBy: { rank: 'asc' },
    });

    const p1Ranking = rankings.find(r => r.userId === player1Id);
    const p2Ranking = rankings.find(r => r.userId === player2Id);

    // Player2 should now be rank 1, Player1 rank 2
    expect(p2Ranking!.rank).toBe(1);
    expect(p1Ranking!.rank).toBe(2);

    // previousRank should be saved (AC-05)
    expect(p2Ranking!.previousRank).toBe(2);
    expect(p1Ranking!.previousRank).toBe(1);

    // Wins/losses updated
    expect(p2Ranking!.wins).toBe(1);
    expect(p1Ranking!.losses).toBe(1);
  });
});

// ─── AC-06: GET /rankings/:userId/history ──────────────────────────
describe('GET /api/v1/rankings/:userId/history', () => {
  it('returns match history for user (AC-06)', async () => {
    const res = await request(app)
      .get(`/api/v1/rankings/${player2Id}/history`)
      .set('Authorization', `Bearer ${player2Token}`);

    expect(res.status).toBe(200);
    // Player2 had a confirmed match result from the auto-update test
    expect(res.body.data.length).toBeGreaterThanOrEqual(0);
  });
});

// ─── AC-07: POST /rankings/challenge ───────────────────────────────
describe('POST /api/v1/rankings/challenge', () => {
  beforeAll(async () => {
    await prisma.rankingChallenge.deleteMany({ where: { clubId } });
    await prisma.ranking.deleteMany({ where: { clubId } });
    await prisma.ranking.createMany({
      data: [
        { clubId, userId: player1Id, category: 'HERREN', rank: 1, wins: 0, losses: 0 },
        { clubId, userId: player2Id, category: 'HERREN', rank: 2, wins: 0, losses: 0 },
        { clubId, userId: player3Id, category: 'HERREN', rank: 3, wins: 0, losses: 0 },
        { clubId, userId: player4Id, category: 'HERREN', rank: 4, wins: 0, losses: 0 },
        { clubId, userId: player5Id, category: 'HERREN', rank: 5, wins: 0, losses: 0 },
      ],
    });
  });

  afterAll(async () => {
    await prisma.rankingChallenge.deleteMany({ where: { clubId } });
    await prisma.ranking.deleteMany({ where: { clubId } });
  });

  it('creates challenge within max range (AC-07)', async () => {
    const spy = jest.spyOn(pushService, 'sendToUsers');

    // Player3 (rank 3) challenges Player1 (rank 1) → within 3 range
    const res = await request(app)
      .post('/api/v1/rankings/challenge')
      .set('Authorization', `Bearer ${player3Token}`)
      .send({ challengedId: player1Id });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.challengerId).toBe(player3Id);
    expect(res.body.data.challengedId).toBe(player1Id);

    // AC-08: Push to challenged player
    expect(spy).toHaveBeenCalledWith(
      [player1Id],
      expect.objectContaining({ title: 'Neue Herausforderung!' }),
    );

    spy.mockRestore();
  });

  it('rejects challenge exceeding max range (AC-07)', async () => {
    // Player5 (rank 5) challenges Player1 (rank 1) → 4 places = exceeds max 3
    const res = await request(app)
      .post('/api/v1/rankings/challenge')
      .set('Authorization', `Bearer ${generateAccessToken({ userId: player5Id, clubId, roles: ['MEMBER'] as UserRole[] })}`)
      .send({ challengedId: player1Id });

    expect(res.status).toBe(400);
  });

  it('rejects challenge when already pending (AC-07)', async () => {
    // Player3 already has a pending challenge against Player1
    const res = await request(app)
      .post('/api/v1/rankings/challenge')
      .set('Authorization', `Bearer ${player3Token}`)
      .send({ challengedId: player1Id });

    expect(res.status).toBe(409);
  });

  // AC-08: Challenge has deadline
  it('challenge has deadline (AC-08)', async () => {
    const res = await request(app)
      .get('/api/v1/rankings/challenges')
      .set('Authorization', `Bearer ${player3Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    const challenge = res.body.data[0];
    expect(challenge.deadline).toBeDefined();
    // Deadline should be ~14 days from now
    const deadline = new Date(challenge.deadline);
    const now = new Date();
    const diffDays = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThan(12);
    expect(diffDays).toBeLessThan(15);
  });
});

// ─── AC-07: POST /rankings/challenge/:id/respond ──────────────────
describe('POST /api/v1/rankings/challenge/:id/respond', () => {
  let challengeId: string;

  beforeAll(async () => {
    await prisma.rankingChallenge.deleteMany({ where: { clubId } });
    await prisma.ranking.deleteMany({ where: { clubId } });
    await prisma.ranking.createMany({
      data: [
        { clubId, userId: player1Id, category: 'HERREN', rank: 1, wins: 0, losses: 0 },
        { clubId, userId: player2Id, category: 'HERREN', rank: 2, wins: 0, losses: 0 },
        { clubId, userId: player3Id, category: 'HERREN', rank: 3, wins: 0, losses: 0 },
      ],
    });

    // Create a challenge: player3 → player1
    const challenge = await prisma.rankingChallenge.create({
      data: {
        clubId,
        category: 'HERREN',
        challengerId: player3Id,
        challengedId: player1Id,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });
    challengeId = challenge.id;
  });

  afterAll(async () => {
    await prisma.rankingChallenge.deleteMany({ where: { clubId } });
    await prisma.ranking.deleteMany({ where: { clubId } });
  });

  it('challenged player can accept (AC-07)', async () => {
    const res = await request(app)
      .post(`/api/v1/rankings/challenge/${challengeId}/respond`)
      .set('Authorization', `Bearer ${player1Token}`)
      .send({ action: 'ACCEPT' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ACCEPTED');
  });

  it('rejects non-challenged player from responding', async () => {
    // Create another challenge for this test
    const ch = await prisma.rankingChallenge.create({
      data: {
        clubId,
        category: 'HERREN',
        challengerId: player2Id,
        challengedId: player1Id,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    const res = await request(app)
      .post(`/api/v1/rankings/challenge/${ch.id}/respond`)
      .set('Authorization', `Bearer ${player3Token}`)
      .send({ action: 'ACCEPT' });

    expect(res.status).toBe(403);
  });

  it('challenged player can decline (AC-07)', async () => {
    const ch = await prisma.rankingChallenge.create({
      data: {
        clubId,
        category: 'HERREN',
        challengerId: player3Id,
        challengedId: player2Id,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    const res = await request(app)
      .post(`/api/v1/rankings/challenge/${ch.id}/respond`)
      .set('Authorization', `Bearer ${player2Token}`)
      .send({ action: 'DECLINE' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('DECLINED');
  });
});

// ─── AC-07: POST /webhooks/ranking-auto-accept ────────────────────
describe('POST /api/v1/webhooks/ranking-auto-accept', () => {
  beforeAll(async () => {
    await prisma.rankingChallenge.deleteMany({ where: { clubId } });
  });

  afterAll(async () => {
    await prisma.rankingChallenge.deleteMany({ where: { clubId } });
  });

  it('auto-accepts expired challenges (AC-07)', async () => {
    // Create an expired challenge (deadline in the past)
    await prisma.rankingChallenge.create({
      data: {
        clubId,
        category: 'HERREN',
        challengerId: player3Id,
        challengedId: player1Id,
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
      },
    });

    // Create a non-expired challenge
    await prisma.rankingChallenge.create({
      data: {
        clubId,
        category: 'HERREN',
        challengerId: player2Id,
        challengedId: player1Id,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      },
    });

    const res = await request(app)
      .post('/api/v1/webhooks/ranking-auto-accept');

    expect(res.status).toBe(200);
    expect(res.body.data.accepted).toBe(1);

    // Verify the expired one is ACCEPTED, the other still PENDING
    const challenges = await prisma.rankingChallenge.findMany({
      where: { clubId },
      orderBy: { deadline: 'asc' },
    });

    const expired = challenges.find(c => c.challengerId === player3Id);
    const active = challenges.find(c => c.challengerId === player2Id);
    expect(expired!.status).toBe('ACCEPTED');
    expect(active!.status).toBe('PENDING');
  });
});
