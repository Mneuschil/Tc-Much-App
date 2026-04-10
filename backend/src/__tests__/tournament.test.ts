import request from 'supertest';
import { prisma } from '../config/database';
import app from '../app';
import { hashPassword, generateAccessToken } from '../services/auth.service';
import * as pushService from '../services/push.service';
import type { UserRole } from '@tennis-club/shared';

const CLUB_CODE = 'TOURNTST';
let clubId: string;
let adminToken: string;
let boardToken: string;
let adminUserId: string;
let boardUserId: string;
let playerIds: string[] = [];
let playerTokens: string[] = [];
let tournamentId: string;

beforeAll(async () => {
  const passwordHash = await hashPassword('password123');

  const club = await prisma.club.create({
    data: { name: 'Tournament Test Club', clubCode: CLUB_CODE },
  });
  clubId = club.id;

  const adminUser = await prisma.user.create({
    data: {
      email: 'tournadmin@test.de',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Turnier',
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
      email: 'tournboard@test.de',
      passwordHash,
      firstName: 'Board',
      lastName: 'Turnier',
      clubId,
      roles: {
        create: [
          { role: 'BOARD_MEMBER', clubId },
          { role: 'MEMBER', clubId },
        ],
      },
    },
  });
  boardUserId = boardUser.id;

  // Create 8 players for bracket tests
  for (let i = 1; i <= 8; i++) {
    const p = await prisma.user.create({
      data: {
        email: `tournp${i}@test.de`,
        passwordHash,
        firstName: `Player${i}`,
        lastName: 'T',
        clubId,
        roles: { create: [{ role: 'MEMBER', clubId }] },
      },
    });
    playerIds.push(p.id);
    playerTokens.push(
      generateAccessToken({ userId: p.id, clubId, roles: ['MEMBER'] as UserRole[] }),
    );
  }

  adminToken = generateAccessToken({
    userId: adminUserId,
    clubId,
    roles: ['CLUB_ADMIN', 'MEMBER'] as UserRole[],
  });
  boardToken = generateAccessToken({
    userId: boardUserId,
    clubId,
    roles: ['BOARD_MEMBER', 'MEMBER'] as UserRole[],
  });
});

afterAll(async () => {
  await prisma.tournamentMatch.deleteMany({ where: { tournament: { clubId } } });
  await prisma.tournamentRegistration.deleteMany({ where: { tournament: { clubId } } });
  await prisma.tournament.deleteMany({ where: { clubId } });
  await prisma.pushToken.deleteMany({ where: { user: { clubId } } });
  await prisma.userRoleAssignment.deleteMany({ where: { clubId } });
  await prisma.refreshToken.deleteMany({ where: { user: { clubId } } });
  await prisma.user.deleteMany({ where: { clubId } });
  await prisma.club.deleteMany({ where: { clubCode: CLUB_CODE } });
  await prisma.$disconnect();
});

// ─── AC-01: POST /tournaments creates tournament ───────────────────
describe('POST /api/v1/tournaments', () => {
  it('creates KNOCKOUT tournament with category and maxParticipants (AC-01)', async () => {
    const res = await request(app)
      .post('/api/v1/tournaments')
      .set('Authorization', `Bearer ${boardToken}`)
      .send({
        name: 'Clubmeisterschaft 2026',
        type: 'KNOCKOUT',
        category: 'SINGLES',
        startDate: '2026-09-01T10:00:00.000Z',
        maxParticipants: 16,
        description: 'Vereinsmeisterschaft Herren Einzel',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Clubmeisterschaft 2026');
    expect(res.body.data.type).toBe('KNOCKOUT');
    expect(res.body.data.category).toBe('SINGLES');
    expect(res.body.data.status).toBe('REGISTRATION_OPEN');
    expect(res.body.data.maxParticipants).toBe(16);
    tournamentId = res.body.data.id;
  });

  it('rejects MEMBER from creating tournament', async () => {
    const res = await request(app)
      .post('/api/v1/tournaments')
      .set('Authorization', `Bearer ${playerTokens[0]}`)
      .send({
        name: 'Verboten',
        type: 'KNOCKOUT',
        category: 'SINGLES',
        startDate: '2026-09-01T10:00:00.000Z',
      });

    expect(res.status).toBe(403);
  });
});

// ─── AC-02: POST /tournaments/:id/register ─────────────────────────
describe('POST /api/v1/tournaments/:id/register', () => {
  it('registers player for tournament (AC-02)', async () => {
    const res = await request(app)
      .post(`/api/v1/tournaments/${tournamentId}/register`)
      .set('Authorization', `Bearer ${playerTokens[0]}`)
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.data.userId).toBe(playerIds[0]);
    expect(res.body.data.tournamentId).toBe(tournamentId);
  });

  it('DOUBLES registration with partnerId (AC-02)', async () => {
    // Create a doubles tournament
    const dRes = await request(app)
      .post('/api/v1/tournaments')
      .set('Authorization', `Bearer ${boardToken}`)
      .send({
        name: 'Doppel CM',
        type: 'KNOCKOUT',
        category: 'DOUBLES',
        startDate: '2026-09-15T10:00:00.000Z',
      });
    const doublesId = dRes.body.data.id;

    const res = await request(app)
      .post(`/api/v1/tournaments/${doublesId}/register`)
      .set('Authorization', `Bearer ${playerTokens[0]}`)
      .send({ partnerId: playerIds[1] });

    expect(res.status).toBe(201);
    expect(res.body.data.partnerId).toBe(playerIds[1]);

    // Cleanup
    await prisma.tournamentRegistration.deleteMany({ where: { tournamentId: doublesId } });
    await prisma.tournament.delete({ where: { id: doublesId } });
  });

  it('registers remaining players for bracket test', async () => {
    // Register players 2-5 (player 1 already registered above)
    for (let i = 1; i < 5; i++) {
      await request(app)
        .post(`/api/v1/tournaments/${tournamentId}/register`)
        .set('Authorization', `Bearer ${playerTokens[i]}`)
        .send({});
    }

    // Set seeds on first 2 players
    await prisma.tournamentRegistration.updateMany({
      where: { tournamentId, userId: playerIds[0] },
      data: { seed: 1 },
    });
    await prisma.tournamentRegistration.updateMany({
      where: { tournamentId, userId: playerIds[1] },
      data: { seed: 2 },
    });
  });
});

// ─── AC-03: GET /tournaments/:id/registrations ─────────────────────
describe('GET /api/v1/tournaments/:id/registrations', () => {
  it('lists all registrations (AC-03)', async () => {
    const res = await request(app)
      .get(`/api/v1/tournaments/${tournamentId}/registrations`)
      .set('Authorization', `Bearer ${playerTokens[0]}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(5);
  });
});

// ─── AC-04 + AC-05: POST /tournaments/:id/draw ─────────────────────
describe('POST /api/v1/tournaments/:id/draw', () => {
  it('generates bracket with seeded players and BYEs (AC-04, AC-05)', async () => {
    const spy = jest.spyOn(pushService, 'sendToUsers');

    const res = await request(app)
      .post(`/api/v1/tournaments/${tournamentId}/draw`)
      .set('Authorization', `Bearer ${boardToken}`);

    expect(res.status).toBe(201);
    const bracket = res.body.data;

    // Should have rounds (5 players → 8-slot bracket → 3 rounds)
    expect(bracket.length).toBe(3);

    // Round 1 should have 4 matches
    expect(bracket[0].roundNumber).toBe(1);
    expect(bracket[0].matches.length).toBe(4);

    // BYEs: 8-5 = 3 BYE slots → 3 walkovers in round 1
    const walkovers = bracket[0].matches.filter((m: { status: string }) => m.status === 'WALKOVER');
    expect(walkovers.length).toBe(3);

    // Seeds distributed: seed 1 should be at position 1 (top), seed 2 at position 4 (bottom)
    // Verify seeds are separated
    const seed1Match = bracket[0].matches.find(
      (m: { player1: { id: string } | null; player2: { id: string } | null }) =>
        m.player1?.id === playerIds[0] || m.player2?.id === playerIds[0],
    );
    const seed2Match = bracket[0].matches.find(
      (m: { player1: { id: string } | null; player2: { id: string } | null }) =>
        m.player1?.id === playerIds[1] || m.player2?.id === playerIds[1],
    );
    expect(seed1Match).toBeDefined();
    expect(seed2Match).toBeDefined();
    // Seeds should be in different halves (positions 1-2 vs 3-4)
    const seed1Pos = seed1Match.position;
    const seed2Pos = seed2Match.position;
    const seed1Half = seed1Pos <= 2 ? 'upper' : 'lower';
    const seed2Half = seed2Pos <= 2 ? 'upper' : 'lower';
    expect(seed1Half).not.toBe(seed2Half);

    // AC-10: Push sent to all registered players
    expect(spy).toHaveBeenCalledWith(
      expect.arrayContaining([playerIds[0]]),
      expect.objectContaining({ title: 'Auslosung fertig!' }),
    );

    spy.mockRestore();
  });

  it('rejects draw when not REGISTRATION_OPEN', async () => {
    const res = await request(app)
      .post(`/api/v1/tournaments/${tournamentId}/draw`)
      .set('Authorization', `Bearer ${boardToken}`);

    expect(res.status).toBe(400);
  });
});

// ─── AC-06 + AC-07: GET /tournaments/:id/bracket ───────────────────
describe('GET /api/v1/tournaments/:id/bracket', () => {
  it('returns KO bracket structure (AC-06, AC-07)', async () => {
    const res = await request(app)
      .get(`/api/v1/tournaments/${tournamentId}/bracket`)
      .set('Authorization', `Bearer ${playerTokens[0]}`);

    expect(res.status).toBe(200);
    const bracket = res.body.data;

    // Bracket structure: rounds[{ roundNumber, matches[{ player1, player2, score, winner, status }] }]
    expect(bracket.length).toBeGreaterThanOrEqual(2);
    expect(bracket[0]).toHaveProperty('roundNumber');
    expect(bracket[0]).toHaveProperty('matches');
    expect(bracket[0].matches[0]).toHaveProperty('player1');
    expect(bracket[0].matches[0]).toHaveProperty('player2');
    expect(bracket[0].matches[0]).toHaveProperty('score');
    expect(bracket[0].matches[0]).toHaveProperty('winner');
    expect(bracket[0].matches[0]).toHaveProperty('status');
  });
});

// ─── AC-08 + AC-09: Result → winner advances ──────────────────────
describe('POST /api/v1/tournaments/:id/result', () => {
  it('records result and advances winner to next round (AC-08, AC-09)', async () => {
    // Find a SCHEDULED match in round 1 (not a walkover)
    const bracket = await request(app)
      .get(`/api/v1/tournaments/${tournamentId}/bracket`)
      .set('Authorization', `Bearer ${boardToken}`);

    const round1 = bracket.body.data.find((r: { roundNumber: number }) => r.roundNumber === 1);
    const scheduledMatch = round1.matches.find(
      (m: { status: string; player1: unknown; player2: unknown }) =>
        m.status === 'SCHEDULED' && m.player1 && m.player2,
    );

    if (!scheduledMatch) {
      // All round 1 matches are BYEs, skip
      return;
    }

    // H-06: Reject winnerId that is not a player in the match
    const invalidWinnerRes = await request(app)
      .post(`/api/v1/tournaments/${tournamentId}/result`)
      .set('Authorization', `Bearer ${boardToken}`)
      .send({
        matchId: scheduledMatch.id,
        winnerId: playerIds[7], // not in this match
        score: '6:3 6:4',
      });

    expect(invalidWinnerRes.status).toBe(400);

    const winnerId = scheduledMatch.player1.id;
    const res = await request(app)
      .post(`/api/v1/tournaments/${tournamentId}/result`)
      .set('Authorization', `Bearer ${boardToken}`)
      .send({
        matchId: scheduledMatch.id,
        winnerId,
        score: '6:3 6:4',
      });

    expect(res.status).toBe(200);

    // Winner should now appear in round 2
    const updatedBracket = await request(app)
      .get(`/api/v1/tournaments/${tournamentId}/bracket`)
      .set('Authorization', `Bearer ${boardToken}`);

    const round2 = updatedBracket.body.data.find(
      (r: { roundNumber: number }) => r.roundNumber === 2,
    );
    const round2Players = round2.matches.flatMap(
      (m: { player1: { id: string } | null; player2: { id: string } | null }) =>
        [m.player1?.id, m.player2?.id].filter(Boolean),
    );
    expect(round2Players).toContain(winnerId);
  });
});

// ─── AC-12: Status flow REGISTRATION_OPEN → IN_PROGRESS → COMPLETED
describe('Tournament status flow (AC-12)', () => {
  it('changes to IN_PROGRESS after draw', async () => {
    const res = await request(app)
      .get(`/api/v1/tournaments/${tournamentId}`)
      .set('Authorization', `Bearer ${boardToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('IN_PROGRESS');
  });
});

// ─── Bracket algorithm with different sizes ────────────────────────
describe('Bracket algorithm edge cases', () => {
  it('handles 4 players (perfect bracket)', async () => {
    const t = await prisma.tournament.create({
      data: {
        name: 'Test 4er',
        type: 'KNOCKOUT',
        category: 'SINGLES',
        startDate: new Date(),
        clubId,
        createdById: adminUserId,
        status: 'REGISTRATION_OPEN',
      },
    });
    for (let i = 0; i < 4; i++) {
      await prisma.tournamentRegistration.create({
        data: { tournamentId: t.id, userId: playerIds[i] },
      });
    }

    const res = await request(app)
      .post(`/api/v1/tournaments/${t.id}/draw`)
      .set('Authorization', `Bearer ${boardToken}`);

    expect(res.status).toBe(201);
    const bracket = res.body.data;
    expect(bracket.length).toBe(2); // 2 rounds for 4 players
    expect(bracket[0].matches.length).toBe(2); // 2 matches in round 1
    // No BYEs with 4 players
    const walkovers = bracket[0].matches.filter((m: { status: string }) => m.status === 'WALKOVER');
    expect(walkovers.length).toBe(0);

    await prisma.tournamentMatch.deleteMany({ where: { tournamentId: t.id } });
    await prisma.tournamentRegistration.deleteMany({ where: { tournamentId: t.id } });
    await prisma.tournament.delete({ where: { id: t.id } });
  });

  it('handles 3 players (1 BYE)', async () => {
    const t = await prisma.tournament.create({
      data: {
        name: 'Test 3er',
        type: 'KNOCKOUT',
        category: 'SINGLES',
        startDate: new Date(),
        clubId,
        createdById: adminUserId,
        status: 'REGISTRATION_OPEN',
      },
    });
    for (let i = 0; i < 3; i++) {
      await prisma.tournamentRegistration.create({
        data: { tournamentId: t.id, userId: playerIds[i] },
      });
    }

    const res = await request(app)
      .post(`/api/v1/tournaments/${t.id}/draw`)
      .set('Authorization', `Bearer ${boardToken}`);

    expect(res.status).toBe(201);
    const bracket = res.body.data;
    expect(bracket.length).toBe(2); // 4-slot bracket → 2 rounds
    expect(bracket[0].matches.length).toBe(2);
    // 1 BYE (4 - 3 = 1)
    const walkovers = bracket[0].matches.filter((m: { status: string }) => m.status === 'WALKOVER');
    expect(walkovers.length).toBe(1);
    // BYE winner should be advanced to round 2
    const round2 = bracket[1];
    const round2Players = round2.matches.flatMap(
      (m: { player1: { id: string } | null; player2: { id: string } | null }) =>
        [m.player1?.id, m.player2?.id].filter(Boolean),
    );
    expect(round2Players.length).toBeGreaterThanOrEqual(1);

    await prisma.tournamentMatch.deleteMany({ where: { tournamentId: t.id } });
    await prisma.tournamentRegistration.deleteMany({ where: { tournamentId: t.id } });
    await prisma.tournament.delete({ where: { id: t.id } });
  });

  it('handles 7 players (1 BYE in 8-slot bracket)', async () => {
    const t = await prisma.tournament.create({
      data: {
        name: 'Test 7er',
        type: 'KNOCKOUT',
        category: 'SINGLES',
        startDate: new Date(),
        clubId,
        createdById: adminUserId,
        status: 'REGISTRATION_OPEN',
      },
    });
    for (let i = 0; i < 7; i++) {
      await prisma.tournamentRegistration.create({
        data: { tournamentId: t.id, userId: playerIds[i] },
      });
    }

    const res = await request(app)
      .post(`/api/v1/tournaments/${t.id}/draw`)
      .set('Authorization', `Bearer ${boardToken}`);

    expect(res.status).toBe(201);
    const bracket = res.body.data;
    expect(bracket.length).toBe(3); // 8-slot → 3 rounds
    expect(bracket[0].matches.length).toBe(4);
    // 1 BYE (8 - 7 = 1)
    const walkovers = bracket[0].matches.filter((m: { status: string }) => m.status === 'WALKOVER');
    expect(walkovers.length).toBe(1);

    await prisma.tournamentMatch.deleteMany({ where: { tournamentId: t.id } });
    await prisma.tournamentRegistration.deleteMany({ where: { tournamentId: t.id } });
    await prisma.tournament.delete({ where: { id: t.id } });
  });

  it('handles 8 players (perfect bracket, no BYEs)', async () => {
    const t = await prisma.tournament.create({
      data: {
        name: 'Test 8er',
        type: 'KNOCKOUT',
        category: 'SINGLES',
        startDate: new Date(),
        clubId,
        createdById: adminUserId,
        status: 'REGISTRATION_OPEN',
      },
    });
    for (let i = 0; i < 8; i++) {
      await prisma.tournamentRegistration.create({
        data: { tournamentId: t.id, userId: playerIds[i] },
      });
    }

    const res = await request(app)
      .post(`/api/v1/tournaments/${t.id}/draw`)
      .set('Authorization', `Bearer ${boardToken}`);

    expect(res.status).toBe(201);
    const bracket = res.body.data;
    expect(bracket.length).toBe(3); // 8 → 3 rounds
    expect(bracket[0].matches.length).toBe(4);
    const walkovers = bracket[0].matches.filter((m: { status: string }) => m.status === 'WALKOVER');
    expect(walkovers.length).toBe(0);

    await prisma.tournamentMatch.deleteMany({ where: { tournamentId: t.id } });
    await prisma.tournamentRegistration.deleteMany({ where: { tournamentId: t.id } });
    await prisma.tournament.delete({ where: { id: t.id } });
  });
});
