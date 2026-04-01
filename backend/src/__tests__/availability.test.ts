import request from 'supertest';
import { prisma } from '../config/database';
import app from '../app';
import { hashPassword, generateAccessToken } from '../services/auth.service';
import * as pushService from '../services/push.service';
import type { UserRole } from '@tennis-club/shared';

const CLUB_CODE = 'AVAILTST';
let clubId: string;
let otherClubId: string;
let adminToken: string;
let boardToken: string;
let member1Token: string;
let member2Token: string;
let nonTeamToken: string;
let adminUserId: string;
let member1UserId: string;
let member2UserId: string;
let nonTeamUserId: string;
let teamId: string;
let teamEventId: string;
let clubEventId: string;

beforeAll(async () => {
  const passwordHash = await hashPassword('password123');

  const club = await prisma.club.create({ data: { name: 'Avail Test Club', clubCode: CLUB_CODE } });
  clubId = club.id;

  const otherClub = await prisma.club.create({ data: { name: 'Other Avail Club', clubCode: 'AVAILOTH' } });
  otherClubId = otherClub.id;

  const adminUser = await prisma.user.create({
    data: {
      email: 'availadmin@test.de', passwordHash, firstName: 'Admin', lastName: 'Avail', clubId,
      roles: { create: [{ role: 'CLUB_ADMIN', clubId }, { role: 'MEMBER', clubId }] },
    },
  });
  adminUserId = adminUser.id;

  const boardUser = await prisma.user.create({
    data: {
      email: 'availboard@test.de', passwordHash, firstName: 'Board', lastName: 'Avail', clubId,
      roles: { create: [{ role: 'BOARD_MEMBER', clubId }, { role: 'MEMBER', clubId }] },
    },
  });

  const member1 = await prisma.user.create({
    data: {
      email: 'availm1@test.de', passwordHash, firstName: 'Spieler1', lastName: 'Avail', clubId,
      roles: { create: [{ role: 'MEMBER', clubId }] },
    },
  });
  member1UserId = member1.id;

  const member2 = await prisma.user.create({
    data: {
      email: 'availm2@test.de', passwordHash, firstName: 'Spieler2', lastName: 'Avail', clubId,
      roles: { create: [{ role: 'MEMBER', clubId }] },
    },
  });
  member2UserId = member2.id;

  const nonTeamUser = await prisma.user.create({
    data: {
      email: 'availnonteam@test.de', passwordHash, firstName: 'NonTeam', lastName: 'Avail', clubId,
      roles: { create: [{ role: 'MEMBER', clubId }] },
    },
  });
  nonTeamUserId = nonTeamUser.id;

  adminToken = generateAccessToken({ userId: adminUser.id, clubId, roles: ['CLUB_ADMIN', 'MEMBER'] as UserRole[] });
  boardToken = generateAccessToken({ userId: boardUser.id, clubId, roles: ['BOARD_MEMBER', 'MEMBER'] as UserRole[] });
  member1Token = generateAccessToken({ userId: member1.id, clubId, roles: ['MEMBER'] as UserRole[] });
  member2Token = generateAccessToken({ userId: member2.id, clubId, roles: ['MEMBER'] as UserRole[] });
  nonTeamToken = generateAccessToken({ userId: nonTeamUser.id, clubId, roles: ['MEMBER'] as UserRole[] });

  // Create team with 2 members
  const team = await prisma.team.create({ data: { name: 'Avail Team', type: 'MATCH_TEAM', clubId } });
  teamId = team.id;
  await prisma.teamMember.createMany({
    data: [
      { teamId, userId: member1UserId, position: 1 },
      { teamId, userId: member2UserId, position: 2 },
    ],
  });

  // Create team event
  const teamEvent = await prisma.event.create({
    data: { title: 'Liga Spiel', type: 'LEAGUE_MATCH', startDate: new Date('2026-06-15T14:00:00Z'), teamId, clubId, createdById: adminUserId },
  });
  teamEventId = teamEvent.id;

  // Create club event (no team)
  const clubEvent = await prisma.event.create({
    data: { title: 'Clubfest', type: 'CLUB_EVENT', startDate: new Date('2026-07-01T12:00:00Z'), clubId, createdById: adminUserId },
  });
  clubEventId = clubEvent.id;
});

afterAll(async () => {
  await prisma.availability.deleteMany({ where: { event: { clubId: { in: [clubId, otherClubId] } } } });
  await prisma.matchLineup.deleteMany({ where: { event: { clubId: { in: [clubId, otherClubId] } } } });
  await prisma.matchResult.deleteMany({ where: { event: { clubId: { in: [clubId, otherClubId] } } } });
  await prisma.event.deleteMany({ where: { clubId: { in: [clubId, otherClubId] } } });
  await prisma.teamMember.deleteMany({ where: { team: { clubId: { in: [clubId, otherClubId] } } } });
  await prisma.team.deleteMany({ where: { clubId: { in: [clubId, otherClubId] } } });
  await prisma.pushToken.deleteMany({ where: { user: { clubId: { in: [clubId, otherClubId] } } } });
  await prisma.userRoleAssignment.deleteMany({ where: { clubId: { in: [clubId, otherClubId] } } });
  await prisma.refreshToken.deleteMany({ where: { user: { clubId: { in: [clubId, otherClubId] } } } });
  await prisma.user.deleteMany({ where: { clubId: { in: [clubId, otherClubId] } } });
  await prisma.club.deleteMany({ where: { clubCode: { in: [CLUB_CODE, 'AVAILOTH'] } } });
  await prisma.$disconnect();
});

// AC-01: PUT /events/:id/availability sets availability
describe('PUT /api/v1/events/:eventId/availability', () => {
  afterEach(async () => {
    await prisma.availability.deleteMany({ where: { eventId: teamEventId } });
  });

  it('sets availability as team member (AC-01)', async () => {
    const res = await request(app)
      .put(`/api/v1/events/${teamEventId}/availability`)
      .set('Authorization', `Bearer ${member1Token}`)
      .send({ eventId: teamEventId, status: 'AVAILABLE', comment: 'Bin dabei!' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('AVAILABLE');
    expect(res.body.data.comment).toBe('Bin dabei!');
  });

  // AC-04: Only team members can set availability for team events
  it('rejects non-team-member for team event (AC-04)', async () => {
    const res = await request(app)
      .put(`/api/v1/events/${teamEventId}/availability`)
      .set('Authorization', `Bearer ${nonTeamToken}`)
      .send({ eventId: teamEventId, status: 'AVAILABLE' });

    expect(res.status).toBe(403);
  });

  it('allows admin for team event even without membership (AC-04)', async () => {
    const res = await request(app)
      .put(`/api/v1/events/${teamEventId}/availability`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ eventId: teamEventId, status: 'AVAILABLE' });

    expect(res.status).toBe(200);
  });

  it('allows any member for club event (no team)', async () => {
    const res = await request(app)
      .put(`/api/v1/events/${clubEventId}/availability`)
      .set('Authorization', `Bearer ${nonTeamToken}`)
      .send({ eventId: clubEventId, status: 'AVAILABLE' });

    expect(res.status).toBe(200);
  });
});

// AC-02: GET /events/:id/availability
describe('GET /api/v1/events/:eventId/availability', () => {
  beforeAll(async () => {
    await prisma.availability.createMany({
      data: [
        { eventId: teamEventId, userId: member1UserId, status: 'AVAILABLE' },
        { eventId: teamEventId, userId: member2UserId, status: 'NOT_AVAILABLE', comment: 'Verletzt' },
      ],
    });
  });

  afterAll(async () => {
    await prisma.availability.deleteMany({ where: { eventId: teamEventId } });
  });

  it('lists all availabilities for event (AC-02)', async () => {
    const res = await request(app)
      .get(`/api/v1/events/${teamEventId}/availability`)
      .set('Authorization', `Bearer ${boardToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });
});

// AC-03: GET /events/:id/availability/summary
describe('GET /api/v1/events/:eventId/availability/summary', () => {
  beforeAll(async () => {
    await prisma.availability.create({
      data: { eventId: teamEventId, userId: member1UserId, status: 'AVAILABLE' },
    });
    // member2 has NOT responded
  });

  afterAll(async () => {
    await prisma.availability.deleteMany({ where: { eventId: teamEventId } });
  });

  it('returns summary with counts + nonResponders (AC-03)', async () => {
    const res = await request(app)
      .get(`/api/v1/events/${teamEventId}/availability/summary`)
      .set('Authorization', `Bearer ${boardToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.available).toBe(1);
    expect(res.body.data.noResponse).toBe(1);
    expect(res.body.data.nonResponders.length).toBe(1);
    expect(res.body.data.nonResponders[0].firstName).toBe('Spieler2');
  });
});

// AC-05 + AC-07: Reminder
describe('POST /api/v1/events/:eventId/availability/remind', () => {
  beforeEach(async () => {
    await prisma.availability.deleteMany({ where: { eventId: teamEventId } });
  });

  it('sends reminder to non-responders (AC-05)', async () => {
    const spy = jest.spyOn(pushService, 'sendToUsers');

    const res = await request(app)
      .post(`/api/v1/events/${teamEventId}/availability/remind`)
      .set('Authorization', `Bearer ${boardToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.sent).toBe(2); // both members haven't responded

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('rejects after max 2 reminders (AC-07)', async () => {
    // Send 2 reminders
    await request(app)
      .post(`/api/v1/events/${teamEventId}/availability/remind`)
      .set('Authorization', `Bearer ${boardToken}`);

    await request(app)
      .post(`/api/v1/events/${teamEventId}/availability/remind`)
      .set('Authorization', `Bearer ${boardToken}`);

    // 3rd should fail
    const res = await request(app)
      .post(`/api/v1/events/${teamEventId}/availability/remind`)
      .set('Authorization', `Bearer ${boardToken}`);

    expect(res.status).toBe(400);
  });
});

// AC-06: Auto-push on team event creation
describe('Auto-Push on Team Event Creation', () => {
  it('sends push to team members when team event is created (AC-06)', async () => {
    const spy = jest.spyOn(pushService, 'sendToTeam');

    await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${boardToken}`)
      .send({
        title: 'Push Test Match',
        type: 'LEAGUE_MATCH',
        startDate: '2026-08-01T14:00:00Z',
        teamId,
      });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(spy).toHaveBeenCalledWith(
      teamId,
      expect.objectContaining({ title: 'Neues Event' }),
      expect.any(String),
    );

    spy.mockRestore();
  });
});

// AC-08: Multi-Tenant
describe('Multi-Tenant', () => {
  it('cannot set availability for other club event (AC-08)', async () => {
    const otherUser = await prisma.user.findFirst({ where: { clubId: otherClubId } });
    if (!otherUser) return;

    const otherToken = generateAccessToken({ userId: otherUser.id, clubId: otherClubId, roles: ['MEMBER'] as UserRole[] });

    const res = await request(app)
      .put(`/api/v1/events/${teamEventId}/availability`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ eventId: teamEventId, status: 'AVAILABLE' });

    expect(res.status).toBe(404); // event not found in their club
  });
});
