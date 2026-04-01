import request from 'supertest';
import { prisma } from '../config/database';
import app from '../app';
import { hashPassword, generateAccessToken } from '../services/auth.service';
import * as pushService from '../services/push.service';
import type { UserRole } from '@tennis-club/shared';

const CLUB_CODE = 'MATCHTST';
let clubId: string;
let adminToken: string;
let boardToken: string;
let playerAToken: string;
let playerBToken: string;
let outsiderToken: string;
let adminUserId: string;
let boardUserId: string;
let playerAId: string;
let playerBId: string;
let outsiderUserId: string;
let teamId: string;
let leagueMatchId: string;
let cupMatchId: string;
let generalChannelId: string;

beforeAll(async () => {
  const passwordHash = await hashPassword('password123');

  const club = await prisma.club.create({ data: { name: 'Match Test Club', clubCode: CLUB_CODE } });
  clubId = club.id;

  // Create "Allgemein" channel for auto-post test
  const adminUserForChannel = await prisma.user.create({
    data: {
      email: 'matchadmin@test.de', passwordHash, firstName: 'Admin', lastName: 'Match', clubId,
      roles: { create: [{ role: 'CLUB_ADMIN', clubId }, { role: 'MEMBER', clubId }] },
    },
  });
  adminUserId = adminUserForChannel.id;

  const generalChannel = await prisma.channel.create({
    data: { name: 'Allgemein', visibility: 'PUBLIC', isDefault: true, clubId, createdById: adminUserId },
  });
  generalChannelId = generalChannel.id;

  const boardUser = await prisma.user.create({
    data: {
      email: 'matchboard@test.de', passwordHash, firstName: 'Board', lastName: 'Match', clubId,
      roles: { create: [{ role: 'BOARD_MEMBER', clubId }, { role: 'MEMBER', clubId }] },
    },
  });
  boardUserId = boardUser.id;

  const playerA = await prisma.user.create({
    data: {
      email: 'matchplayera@test.de', passwordHash, firstName: 'PlayerA', lastName: 'Match', clubId,
      roles: { create: [{ role: 'MEMBER', clubId }] },
    },
  });
  playerAId = playerA.id;

  const playerB = await prisma.user.create({
    data: {
      email: 'matchplayerb@test.de', passwordHash, firstName: 'PlayerB', lastName: 'Match', clubId,
      roles: { create: [{ role: 'MEMBER', clubId }] },
    },
  });
  playerBId = playerB.id;

  const outsider = await prisma.user.create({
    data: {
      email: 'matchoutsider@test.de', passwordHash, firstName: 'Outsider', lastName: 'Match', clubId,
      roles: { create: [{ role: 'MEMBER', clubId }] },
    },
  });
  outsiderUserId = outsider.id;

  adminToken = generateAccessToken({ userId: adminUserId, clubId, roles: ['CLUB_ADMIN', 'MEMBER'] as UserRole[] });
  boardToken = generateAccessToken({ userId: boardUserId, clubId, roles: ['BOARD_MEMBER', 'MEMBER'] as UserRole[] });
  playerAToken = generateAccessToken({ userId: playerAId, clubId, roles: ['MEMBER'] as UserRole[] });
  playerBToken = generateAccessToken({ userId: playerBId, clubId, roles: ['MEMBER'] as UserRole[] });
  outsiderToken = generateAccessToken({ userId: outsiderUserId, clubId, roles: ['MEMBER'] as UserRole[] });

  // Create team with playerA and playerB
  const team = await prisma.team.create({ data: { name: 'Match Team', type: 'MATCH_TEAM', clubId } });
  teamId = team.id;

  await prisma.teamMember.createMany({
    data: [
      { teamId, userId: playerAId, position: 1 },
      { teamId, userId: playerBId, position: 2 },
    ],
  });

  // Create league match event
  const leagueMatch = await prisma.event.create({
    data: {
      title: 'Liga Runde 3 vs TC Gegner',
      type: 'LEAGUE_MATCH',
      startDate: new Date('2026-07-15T14:00:00Z'),
      teamId,
      clubId,
      createdById: adminUserId,
    },
  });
  leagueMatchId = leagueMatch.id;

  // Create cup match event (non-league, for AC-10 negative test)
  const cupMatch = await prisma.event.create({
    data: {
      title: 'Pokal Runde 1',
      type: 'CUP_MATCH',
      startDate: new Date('2026-08-01T10:00:00Z'),
      teamId,
      clubId,
      createdById: adminUserId,
    },
  });
  cupMatchId = cupMatch.id;
});

afterAll(async () => {
  await prisma.message.deleteMany({ where: { channelId: generalChannelId } });
  await prisma.matchResult.deleteMany({ where: { event: { clubId } } });
  await prisma.matchLineup.deleteMany({ where: { event: { clubId } } });
  await prisma.event.deleteMany({ where: { clubId } });
  await prisma.teamMember.deleteMany({ where: { team: { clubId } } });
  await prisma.team.deleteMany({ where: { clubId } });
  await prisma.channel.deleteMany({ where: { clubId } });
  await prisma.pushToken.deleteMany({ where: { user: { clubId } } });
  await prisma.userRoleAssignment.deleteMany({ where: { clubId } });
  await prisma.refreshToken.deleteMany({ where: { user: { clubId } } });
  await prisma.user.deleteMany({ where: { clubId } });
  await prisma.club.deleteMany({ where: { clubCode: CLUB_CODE } });
  await prisma.$disconnect();
});

// ─── AC-01: POST /matches/:id/result submits result with sets ───────
describe('POST /api/v1/matches/:matchId/result', () => {
  afterEach(async () => {
    await prisma.matchResult.deleteMany({ where: { eventId: leagueMatchId } });
  });

  it('submits result with sets scoring (AC-01, AC-02)', async () => {
    const res = await request(app)
      .post(`/api/v1/matches/${leagueMatchId}/result`)
      .set('Authorization', `Bearer ${playerAToken}`)
      .send({
        sets: [
          { games1: 6, games2: 3, tiebreak1: null, tiebreak2: null },
          { games1: 4, games2: 6, tiebreak1: null, tiebreak2: null },
          { games1: 7, games2: 6, tiebreak1: 7, tiebreak2: 5 },
        ],
        winnerId: playerAId,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('SUBMITTED');
    expect(res.body.data.sets).toHaveLength(3);
    expect(res.body.data.sets[2].tiebreak1).toBe(7);
    expect(res.body.data.winnerId).toBe(playerAId);
  });

  // AC-03: Push to Player B after A submits
  it('sends push to team members after submission (AC-03)', async () => {
    const spy = jest.spyOn(pushService, 'sendToUsers');

    await request(app)
      .post(`/api/v1/matches/${leagueMatchId}/result`)
      .set('Authorization', `Bearer ${playerAToken}`)
      .send({
        sets: [{ games1: 6, games2: 3, tiebreak1: null, tiebreak2: null }],
        winnerId: playerAId,
      });

    expect(spy).toHaveBeenCalledWith(
      expect.arrayContaining([playerBId]),
      expect.objectContaining({ title: 'Ergebnis bestaetigen?' }),
    );
    // Should NOT include the submitter
    const calledUserIds = spy.mock.calls[0][0];
    expect(calledUserIds).not.toContain(playerAId);

    spy.mockRestore();
  });

  // AC-09: Only involved players/captain can submit
  it('rejects submission by non-team-member (AC-09)', async () => {
    const res = await request(app)
      .post(`/api/v1/matches/${leagueMatchId}/result`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({
        sets: [{ games1: 6, games2: 3, tiebreak1: null, tiebreak2: null }],
        winnerId: playerAId,
      });

    expect(res.status).toBe(403);
  });
});

// ─── AC-04: POST /matches/:id/result/confirm ───────────────────────
describe('POST /api/v1/matches/:matchId/result/confirm', () => {
  beforeEach(async () => {
    await prisma.matchResult.deleteMany({ where: { eventId: cupMatchId } });
    await prisma.matchResult.create({
      data: {
        eventId: cupMatchId,
        submittedById: playerAId,
        status: 'SUBMITTED',
        sets: JSON.parse(JSON.stringify([{ games1: 6, games2: 4, tiebreak1: null, tiebreak2: null }])),
        winnerId: playerAId,
      },
    });
  });

  afterEach(async () => {
    await prisma.matchResult.deleteMany({ where: { eventId: cupMatchId } });
  });

  it('Player B confirms result → COMPLETED (AC-04)', async () => {
    const res = await request(app)
      .post(`/api/v1/matches/${cupMatchId}/result/confirm`)
      .set('Authorization', `Bearer ${playerBToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CONFIRMED');
    expect(res.body.data.confirmedBy.firstName).toBe('PlayerB');
  });

  it('submitter cannot confirm own result (AC-04)', async () => {
    const res = await request(app)
      .post(`/api/v1/matches/${cupMatchId}/result/confirm`)
      .set('Authorization', `Bearer ${playerAToken}`);

    expect(res.status).toBe(400);
  });
});

// ─── AC-05: POST /matches/:id/result/reject → DISPUTED ─────────────
describe('POST /api/v1/matches/:matchId/result/reject', () => {
  beforeEach(async () => {
    await prisma.matchResult.deleteMany({ where: { eventId: leagueMatchId } });
    await prisma.matchResult.create({
      data: {
        eventId: leagueMatchId,
        submittedById: playerAId,
        status: 'SUBMITTED',
        sets: JSON.parse(JSON.stringify([{ games1: 6, games2: 4, tiebreak1: null, tiebreak2: null }])),
        winnerId: playerAId,
      },
    });
  });

  afterEach(async () => {
    await prisma.matchResult.deleteMany({ where: { eventId: leagueMatchId } });
  });

  it('Player B rejects → status DISPUTED (AC-05)', async () => {
    const res = await request(app)
      .post(`/api/v1/matches/${leagueMatchId}/result/reject`)
      .set('Authorization', `Bearer ${playerBToken}`)
      .send({ rejectionReason: 'Ergebnis stimmt nicht, war 6:3 nicht 6:4' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('DISPUTED');
    expect(res.body.data.rejectionReason).toContain('stimmt nicht');
  });

  // AC-06: Push to Sportwart on dispute
  it('sends push to board/sportwart on dispute (AC-06)', async () => {
    const spy = jest.spyOn(pushService, 'sendToUsers');

    await request(app)
      .post(`/api/v1/matches/${leagueMatchId}/result/reject`)
      .set('Authorization', `Bearer ${playerBToken}`)
      .send({ rejectionReason: 'Falsches Ergebnis' });

    expect(spy).toHaveBeenCalledWith(
      expect.arrayContaining([boardUserId]),
      expect.objectContaining({ title: 'Ergebnis-Streit' }),
    );

    spy.mockRestore();
  });
});

// ─── AC-07: POST /matches/:id/result/resolve ───────────────────────
describe('POST /api/v1/matches/:matchId/result/resolve', () => {
  beforeEach(async () => {
    await prisma.matchResult.deleteMany({ where: { eventId: leagueMatchId } });
    await prisma.matchResult.create({
      data: {
        eventId: leagueMatchId,
        submittedById: playerAId,
        confirmedById: playerBId,
        status: 'DISPUTED',
        sets: JSON.parse(JSON.stringify([{ games1: 6, games2: 4, tiebreak1: null, tiebreak2: null }])),
        winnerId: playerAId,
        disputeNote: 'Streit ueber Ergebnis',
      },
    });
  });

  afterEach(async () => {
    await prisma.message.deleteMany({ where: { channelId: generalChannelId } });
    await prisma.matchResult.deleteMany({ where: { eventId: leagueMatchId } });
  });

  it('Sportwart resolves dispute → CONFIRMED (AC-07)', async () => {
    const res = await request(app)
      .post(`/api/v1/matches/${leagueMatchId}/result/resolve`)
      .set('Authorization', `Bearer ${boardToken}`)
      .send({
        sets: [{ games1: 6, games2: 3, tiebreak1: null, tiebreak2: null }],
        winnerId: playerBId,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CONFIRMED');
    expect(res.body.data.resolvedById).toBe(boardUserId);
    expect(res.body.data.winnerId).toBe(playerBId);
  });

  it('member cannot resolve dispute (AC-07)', async () => {
    const res = await request(app)
      .post(`/api/v1/matches/${leagueMatchId}/result/resolve`)
      .set('Authorization', `Bearer ${playerAToken}`)
      .send({
        sets: [{ games1: 6, games2: 3, tiebreak1: null, tiebreak2: null }],
        winnerId: playerBId,
      });

    expect(res.status).toBe(403);
  });
});

// ─── AC-08: GET /matches/:id gives match with result + status ──────
describe('GET /api/v1/matches/:matchId', () => {
  beforeAll(async () => {
    await prisma.matchResult.deleteMany({ where: { eventId: leagueMatchId } });
    await prisma.matchResult.create({
      data: {
        eventId: leagueMatchId,
        submittedById: playerAId,
        confirmedById: playerBId,
        status: 'CONFIRMED',
        sets: JSON.parse(JSON.stringify([
          { games1: 6, games2: 3, tiebreak1: null, tiebreak2: null },
          { games1: 6, games2: 4, tiebreak1: null, tiebreak2: null },
        ])),
        winnerId: playerAId,
      },
    });
  });

  afterAll(async () => {
    await prisma.matchResult.deleteMany({ where: { eventId: leagueMatchId } });
  });

  it('returns match with full result + status (AC-08)', async () => {
    const res = await request(app)
      .get(`/api/v1/matches/${leagueMatchId}`)
      .set('Authorization', `Bearer ${playerAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(leagueMatchId);
    expect(res.body.data.matchResults).toHaveLength(1);
    expect(res.body.data.matchResults[0].status).toBe('CONFIRMED');
    expect(res.body.data.matchResults[0].sets).toHaveLength(2);
    expect(res.body.data.matchResults[0].winner.firstName).toBe('PlayerA');
  });
});

// ─── AC-10: Auto-post in General channel for completed league match ──
describe('Auto-post in General channel (AC-10)', () => {
  beforeEach(async () => {
    await prisma.message.deleteMany({ where: { channelId: generalChannelId } });
    await prisma.matchResult.deleteMany({ where: { eventId: leagueMatchId } });
  });

  afterEach(async () => {
    await prisma.message.deleteMany({ where: { channelId: generalChannelId } });
    await prisma.matchResult.deleteMany({ where: { eventId: leagueMatchId } });
  });

  it('posts result to General channel when league match confirmed (AC-10)', async () => {
    // Submit result
    await prisma.matchResult.create({
      data: {
        eventId: leagueMatchId,
        submittedById: playerAId,
        status: 'SUBMITTED',
        sets: JSON.parse(JSON.stringify([{ games1: 6, games2: 3, tiebreak1: null, tiebreak2: null }])),
        winnerId: playerAId,
      },
    });

    // Confirm result
    await request(app)
      .post(`/api/v1/matches/${leagueMatchId}/result/confirm`)
      .set('Authorization', `Bearer ${playerBToken}`);

    // Check General channel for auto-post
    const messages = await prisma.message.findMany({
      where: { channelId: generalChannelId },
    });

    expect(messages.length).toBeGreaterThanOrEqual(1);
    expect(messages[0].content).toContain('Ergebnis');
    expect(messages[0].content).toContain('Liga Runde 3');
  });

  it('does NOT auto-post for non-league matches (AC-10)', async () => {
    await prisma.matchResult.deleteMany({ where: { eventId: cupMatchId } });

    // Submit result for CUP match
    await prisma.matchResult.create({
      data: {
        eventId: cupMatchId,
        submittedById: playerAId,
        status: 'SUBMITTED',
        sets: JSON.parse(JSON.stringify([{ games1: 6, games2: 3, tiebreak1: null, tiebreak2: null }])),
        winnerId: playerAId,
      },
    });

    await request(app)
      .post(`/api/v1/matches/${cupMatchId}/result/confirm`)
      .set('Authorization', `Bearer ${playerBToken}`);

    const messages = await prisma.message.findMany({
      where: { channelId: generalChannelId },
    });

    expect(messages.length).toBe(0);

    await prisma.matchResult.deleteMany({ where: { eventId: cupMatchId } });
  });
});
