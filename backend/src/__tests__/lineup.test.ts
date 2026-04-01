import request from 'supertest';
import { prisma } from '../config/database';
import app from '../app';
import { hashPassword, generateAccessToken } from '../services/auth.service';
import * as pushService from '../services/push.service';
import * as lineupService from '../services/lineup.service';
import type { UserRole } from '@tennis-club/shared';

const CLUB_CODE = 'LINUPTST';
let clubId: string;
let adminToken: string;
let boardToken: string;
let memberToken: string;
let adminUserId: string;
let boardUserId: string;
let player1Id: string;
let player2Id: string;
let player3Id: string;
let player4Id: string;
let player5Id: string;
let teamId: string;
let matchEventId: string;

beforeAll(async () => {
  const passwordHash = await hashPassword('password123');

  const club = await prisma.club.create({ data: { name: 'Lineup Test Club', clubCode: CLUB_CODE } });
  clubId = club.id;

  const adminUser = await prisma.user.create({
    data: {
      email: 'linupadmin@test.de', passwordHash, firstName: 'Admin', lastName: 'Lineup', clubId,
      roles: { create: [{ role: 'CLUB_ADMIN', clubId }, { role: 'MEMBER', clubId }] },
    },
  });
  adminUserId = adminUser.id;

  const boardUser = await prisma.user.create({
    data: {
      email: 'linupboard@test.de', passwordHash, firstName: 'Board', lastName: 'Lineup', clubId,
      roles: { create: [{ role: 'BOARD_MEMBER', clubId }, { role: 'MEMBER', clubId }] },
    },
  });
  boardUserId = boardUser.id;

  // Create 5 players
  const players = [];
  for (let i = 1; i <= 5; i++) {
    const p = await prisma.user.create({
      data: {
        email: `linupp${i}@test.de`, passwordHash, firstName: `Spieler${i}`, lastName: 'Lineup', clubId,
        roles: { create: [{ role: 'MEMBER', clubId }] },
      },
    });
    players.push(p);
  }
  [player1Id, player2Id, player3Id, player4Id, player5Id] = players.map(p => p.id);

  // Create a non-team member for auth tests
  const memberUser = players[0]; // player1 also serves as "member" token

  adminToken = generateAccessToken({ userId: adminUser.id, clubId, roles: ['CLUB_ADMIN', 'MEMBER'] as UserRole[] });
  boardToken = generateAccessToken({ userId: boardUser.id, clubId, roles: ['BOARD_MEMBER', 'MEMBER'] as UserRole[] });
  memberToken = generateAccessToken({ userId: player1Id, clubId, roles: ['MEMBER'] as UserRole[] });

  // Create team with 5 players, positions 1-5
  const team = await prisma.team.create({ data: { name: 'Lineup Team', type: 'MATCH_TEAM', clubId } });
  teamId = team.id;

  await prisma.teamMember.createMany({
    data: [
      { teamId, userId: player1Id, position: 1 },
      { teamId, userId: player2Id, position: 2 },
      { teamId, userId: player3Id, position: 3 },
      { teamId, userId: player4Id, position: 4 },
      { teamId, userId: player5Id, position: 5 },
    ],
  });

  // Create match event
  const event = await prisma.event.create({
    data: {
      title: 'Liga Runde 5',
      type: 'LEAGUE_MATCH',
      startDate: new Date('2026-07-01T14:00:00Z'),
      teamId,
      clubId,
      createdById: adminUserId,
    },
  });
  matchEventId = event.id;
});

afterAll(async () => {
  await prisma.matchLineup.deleteMany({ where: { event: { clubId } } });
  await prisma.availability.deleteMany({ where: { event: { clubId } } });
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

// AC-01 + AC-02: Suggest lineup sorted by position, starters vs substitutes
describe('GET /api/v1/events/:eventId/lineup/suggest', () => {
  beforeEach(async () => {
    await prisma.availability.deleteMany({ where: { eventId: matchEventId } });
  });

  it('suggests lineup based on availability + positionRank (AC-01, AC-02)', async () => {
    // All 5 available, team size defaults to min(5,6) = 5
    await prisma.availability.createMany({
      data: [
        { eventId: matchEventId, userId: player1Id, status: 'AVAILABLE' },
        { eventId: matchEventId, userId: player2Id, status: 'AVAILABLE' },
        { eventId: matchEventId, userId: player3Id, status: 'AVAILABLE' },
        { eventId: matchEventId, userId: player4Id, status: 'AVAILABLE' },
        { eventId: matchEventId, userId: player5Id, status: 'AVAILABLE' },
      ],
    });

    const res = await request(app)
      .get(`/api/v1/events/${matchEventId}/lineup/suggest`)
      .set('Authorization', `Bearer ${boardToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.starters.length).toBe(5);
    expect(res.body.data.substitutes.length).toBe(0);

    // Verify ordering by position
    expect(res.body.data.starters[0].userName).toContain('Spieler1');
    expect(res.body.data.starters[0].positionRank).toBe(1);
    expect(res.body.data.starters[4].userName).toContain('Spieler5');
  });

  // AC-03: Fewer available than team size
  it('all available as starters when fewer than teamSize (AC-03)', async () => {
    await prisma.availability.createMany({
      data: [
        { eventId: matchEventId, userId: player1Id, status: 'AVAILABLE' },
        { eventId: matchEventId, userId: player3Id, status: 'AVAILABLE' },
        { eventId: matchEventId, userId: player5Id, status: 'NOT_AVAILABLE' },
      ],
    });

    const res = await request(app)
      .get(`/api/v1/events/${matchEventId}/lineup/suggest`)
      .set('Authorization', `Bearer ${boardToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.starters.length).toBe(2);
    expect(res.body.data.substitutes.length).toBe(0);
    // Player1 (pos 1) before Player3 (pos 3)
    expect(res.body.data.starters[0].userName).toContain('Spieler1');
    expect(res.body.data.starters[1].userName).toContain('Spieler3');
  });

  // AC-04: No one available
  it('returns empty lineup when no one available (AC-04)', async () => {
    // No availability records = no one responded
    const res = await request(app)
      .get(`/api/v1/events/${matchEventId}/lineup/suggest`)
      .set('Authorization', `Bearer ${boardToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.starters.length).toBe(0);
    expect(res.body.data.substitutes.length).toBe(0);
  });
});

// AC-05: Save lineup
describe('POST /api/v1/events/:eventId/lineup', () => {
  afterEach(async () => {
    await prisma.matchLineup.deleteMany({ where: { eventId: matchEventId } });
  });

  it('saves lineup as Board (AC-05)', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${matchEventId}/lineup`)
      .set('Authorization', `Bearer ${boardToken}`)
      .send({
        lineup: [
          { userId: player1Id, position: 1 },
          { userId: player2Id, position: 2 },
          { userId: player3Id, position: 3 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.length).toBe(3);
    expect(res.body.data[0].user.firstName).toBe('Spieler1');
  });

  // AC-09: Member cannot save lineup
  it('rejects MEMBER from saving lineup (AC-09)', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${matchEventId}/lineup`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        lineup: [{ userId: player1Id, position: 1 }],
      });

    expect(res.status).toBe(403);
  });
});

// AC-05: Update lineup (PUT)
describe('PUT /api/v1/events/:eventId/lineup', () => {
  beforeEach(async () => {
    await prisma.matchLineup.deleteMany({ where: { eventId: matchEventId } });
    await prisma.matchLineup.createMany({
      data: [
        { eventId: matchEventId, teamId, userId: player1Id, position: 1 },
        { eventId: matchEventId, teamId, userId: player2Id, position: 2 },
      ],
    });
  });

  afterEach(async () => {
    await prisma.matchLineup.deleteMany({ where: { eventId: matchEventId } });
  });

  it('updates existing lineup with new positions (AC-05)', async () => {
    const res = await request(app)
      .put(`/api/v1/events/${matchEventId}/lineup`)
      .set('Authorization', `Bearer ${boardToken}`)
      .send({
        lineup: [
          { userId: player3Id, position: 1 },
          { userId: player4Id, position: 2 },
          { userId: player5Id, position: 3 },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(3);
    expect(res.body.data[0].user.firstName).toBe('Spieler3');
  });
});

// AC-06: Get lineup
describe('GET /api/v1/events/:eventId/lineup', () => {
  beforeAll(async () => {
    await prisma.matchLineup.createMany({
      data: [
        { eventId: matchEventId, teamId, userId: player1Id, position: 1 },
        { eventId: matchEventId, teamId, userId: player2Id, position: 2 },
      ],
    });
  });

  afterAll(async () => {
    await prisma.matchLineup.deleteMany({ where: { eventId: matchEventId } });
  });

  it('returns saved lineup (AC-06)', async () => {
    const res = await request(app)
      .get(`/api/v1/events/${matchEventId}/lineup`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].position).toBe(1);
  });
});

// AC-07: Confirm lineup sends push
describe('POST /api/v1/events/:eventId/lineup/confirm', () => {
  beforeAll(async () => {
    await prisma.matchLineup.deleteMany({ where: { eventId: matchEventId } });
    await prisma.matchLineup.createMany({
      data: [
        { eventId: matchEventId, teamId, userId: player1Id, position: 1 },
        { eventId: matchEventId, teamId, userId: player2Id, position: 2 },
      ],
    });
  });

  afterAll(async () => {
    await prisma.matchLineup.deleteMany({ where: { eventId: matchEventId } });
  });

  it('confirms lineup and sends push with position + date to players (AC-06, AC-07)', async () => {
    const spy = jest.spyOn(pushService, 'sendToUsers');

    const res = await request(app)
      .post(`/api/v1/events/${matchEventId}/lineup/confirm`)
      .set('Authorization', `Bearer ${boardToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.confirmed).toBe(true);
    expect(res.body.data.notifiedCount).toBe(2);

    // Each player gets individual push with their position
    expect(spy).toHaveBeenCalledWith(
      [player1Id],
      expect.objectContaining({
        title: 'Aufstellung bestaetigt',
        body: expect.stringContaining('Position 1'),
      }),
    );
    expect(spy).toHaveBeenCalledWith(
      [player2Id],
      expect.objectContaining({
        body: expect.stringContaining('Position 2'),
      }),
    );
    // Body contains date and opponent
    const call = spy.mock.calls[0][1];
    expect(call.body).toMatch(/Du spielst am \d{2}\.\d{2}\.\d{4} auf Position \d+ gegen .+!/);

    spy.mockRestore();
  });

  // AC-09: Member cannot confirm
  it('rejects MEMBER from confirming lineup (AC-09)', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${matchEventId}/lineup/confirm`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(403);
  });
});

// AC-08: Availability change triggers captain notification
describe('handleAvailabilityChange', () => {
  beforeAll(async () => {
    await prisma.matchLineup.deleteMany({ where: { eventId: matchEventId } });
    await prisma.matchLineup.create({
      data: { eventId: matchEventId, teamId, userId: player1Id, position: 1 },
    });

    // Make boardUser a TEAM_CAPTAIN for notification
    await prisma.userRoleAssignment.create({
      data: { userId: boardUserId, clubId, role: 'TEAM_CAPTAIN' },
    });
  });

  afterAll(async () => {
    await prisma.matchLineup.deleteMany({ where: { eventId: matchEventId } });
    await prisma.availability.deleteMany({ where: { eventId: matchEventId } });
    await prisma.userRoleAssignment.deleteMany({
      where: { userId: boardUserId, role: 'TEAM_CAPTAIN' },
    });
  });

  it('notifies captain when lineup player becomes unavailable (AC-08)', async () => {
    const spy = jest.spyOn(pushService, 'sendToUsers');

    // Player1 sets NOT_AVAILABLE (is in lineup)
    await request(app)
      .put(`/api/v1/events/${matchEventId}/availability`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ eventId: matchEventId, status: 'NOT_AVAILABLE' });

    await new Promise(resolve => setTimeout(resolve, 200));

    expect(spy).toHaveBeenCalledWith(
      expect.arrayContaining([boardUserId]),
      expect.objectContaining({ title: 'Absage: Aufgestellter Spieler' }),
    );

    spy.mockRestore();
  });
});
