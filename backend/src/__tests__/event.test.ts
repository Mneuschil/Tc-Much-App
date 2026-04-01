import request from 'supertest';
import { prisma } from '../config/database';
import app from '../app';
import { hashPassword, generateAccessToken } from '../services/auth.service';
import * as pushService from '../services/push.service';
import type { UserRole } from '@tennis-club/shared';

const CLUB_CODE = 'EVNTTEST';
let clubId: string;
let otherClubId: string;
let adminToken: string;
let boardToken: string;
let memberToken: string;
let otherClubToken: string;
let adminUserId: string;
let memberUserId: string;

beforeAll(async () => {
  const passwordHash = await hashPassword('password123');

  const club = await prisma.club.create({ data: { name: 'Event Test Club', clubCode: CLUB_CODE } });
  clubId = club.id;

  const otherClub = await prisma.club.create({ data: { name: 'Other Event Club', clubCode: 'EVNTOTH1' } });
  otherClubId = otherClub.id;

  const adminUser = await prisma.user.create({
    data: {
      email: 'evntadmin@test.de', passwordHash, firstName: 'Admin', lastName: 'Event', clubId,
      roles: { create: [{ role: 'CLUB_ADMIN', clubId }, { role: 'MEMBER', clubId }] },
    },
  });
  adminUserId = adminUser.id;

  const boardUser = await prisma.user.create({
    data: {
      email: 'evntboard@test.de', passwordHash, firstName: 'Board', lastName: 'Event', clubId,
      roles: { create: [{ role: 'BOARD_MEMBER', clubId }, { role: 'MEMBER', clubId }] },
    },
  });

  const memberUser = await prisma.user.create({
    data: {
      email: 'evntmember@test.de', passwordHash, firstName: 'Member', lastName: 'Event', clubId,
      roles: { create: [{ role: 'MEMBER', clubId }] },
    },
  });
  memberUserId = memberUser.id;

  const otherUser = await prisma.user.create({
    data: {
      email: 'evntother@test.de', passwordHash, firstName: 'Other', lastName: 'Event', clubId: otherClubId,
      roles: { create: [{ role: 'MEMBER', clubId: otherClubId }] },
    },
  });

  // Create event in other club for multi-tenant test
  await prisma.event.create({
    data: {
      title: 'Other Club Match', type: 'LEAGUE_MATCH',
      startDate: new Date('2026-06-01T10:00:00Z'),
      clubId: otherClubId, createdById: otherUser.id,
    },
  });

  adminToken = generateAccessToken({ userId: adminUser.id, clubId, roles: ['CLUB_ADMIN', 'MEMBER'] as UserRole[] });
  boardToken = generateAccessToken({ userId: boardUser.id, clubId, roles: ['BOARD_MEMBER', 'MEMBER'] as UserRole[] });
  memberToken = generateAccessToken({ userId: memberUser.id, clubId, roles: ['MEMBER'] as UserRole[] });
  otherClubToken = generateAccessToken({ userId: otherUser.id, clubId: otherClubId, roles: ['MEMBER'] as UserRole[] });
});

afterAll(async () => {
  await prisma.availability.deleteMany({ where: { event: { clubId: { in: [clubId, otherClubId] } } } });
  await prisma.matchLineup.deleteMany({ where: { event: { clubId: { in: [clubId, otherClubId] } } } });
  await prisma.matchResult.deleteMany({ where: { event: { clubId: { in: [clubId, otherClubId] } } } });
  await prisma.event.deleteMany({ where: { clubId: { in: [clubId, otherClubId] } } });
  await prisma.teamMember.deleteMany({ where: { team: { clubId: { in: [clubId, otherClubId] } } } });
  await prisma.team.deleteMany({ where: { clubId: { in: [clubId, otherClubId] } } });
  await prisma.userRoleAssignment.deleteMany({ where: { clubId: { in: [clubId, otherClubId] } } });
  await prisma.refreshToken.deleteMany({ where: { user: { clubId: { in: [clubId, otherClubId] } } } });
  await prisma.user.deleteMany({ where: { clubId: { in: [clubId, otherClubId] } } });
  await prisma.club.deleteMany({ where: { clubCode: { in: [CLUB_CODE, 'EVNTOTH1'] } } });
  await prisma.$disconnect();
});

// AC-01: POST /events creates event
describe('POST /api/v1/events', () => {
  it('creates event with type and date (AC-01)', async () => {
    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${boardToken}`)
      .send({
        title: 'Bezirksliga Runde 3',
        type: 'LEAGUE_MATCH',
        location: 'TC Much',
        startDate: '2026-06-15T14:00:00Z',
        isHomeGame: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Bezirksliga Runde 3');
    expect(res.body.data.type).toBe('LEAGUE_MATCH');
    expect(res.body.data.isHomeGame).toBe(true);
  });

  // AC-09: MEMBER cannot create
  it('rejects MEMBER from creating event (AC-09)', async () => {
    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        title: 'Fail', type: 'TRAINING',
        startDate: '2026-06-20T10:00:00Z',
      });

    expect(res.status).toBe(403);
  });
});

// AC-02: GET /events with filters
describe('GET /api/v1/events', () => {
  beforeAll(async () => {
    await prisma.event.createMany({
      data: [
        { title: 'Training Mo', type: 'TRAINING', startDate: new Date('2026-07-01T18:00:00Z'), clubId, createdById: adminUserId },
        { title: 'Training Mi', type: 'TRAINING', startDate: new Date('2026-07-03T18:00:00Z'), clubId, createdById: adminUserId },
        { title: 'Clubfest', type: 'CLUB_EVENT', startDate: new Date('2026-08-01T12:00:00Z'), clubId, createdById: adminUserId },
      ],
    });
  });

  it('lists all club events (AC-02)', async () => {
    const res = await request(app)
      .get('/api/v1/events')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
  });

  it('filters by type (AC-02)', async () => {
    const res = await request(app)
      .get('/api/v1/events?type=TRAINING')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    for (const event of res.body.data) {
      expect(event.type).toBe('TRAINING');
    }
  });

  it('filters by date range (AC-02)', async () => {
    const res = await request(app)
      .get('/api/v1/events?from=2026-07-01T00:00:00Z&to=2026-07-31T23:59:59Z')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2); // Training Mo + Mi
  });
});

// AC-03: GET /events/:id
describe('GET /api/v1/events/:eventId', () => {
  let eventId: string;

  beforeAll(async () => {
    const event = await prisma.event.create({
      data: { title: 'Detail Event', type: 'CLUB_EVENT', startDate: new Date('2026-09-01T10:00:00Z'), clubId, createdById: adminUserId },
    });
    eventId = event.id;

    await prisma.availability.create({
      data: { eventId, userId: memberUserId, status: 'AVAILABLE' },
    });
  });

  it('returns event detail with availabilities (AC-03)', async () => {
    const res = await request(app)
      .get(`/api/v1/events/${eventId}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Detail Event');
    expect(res.body.data.availabilities.length).toBe(1);
    expect(res.body.data.availabilities[0].status).toBe('AVAILABLE');
  });
});

// AC-04: PUT /events/:id
describe('PUT /api/v1/events/:eventId', () => {
  let eventId: string;

  beforeAll(async () => {
    const event = await prisma.event.create({
      data: { title: 'Update Event', type: 'TRAINING', startDate: new Date('2026-10-01T18:00:00Z'), clubId, createdById: adminUserId },
    });
    eventId = event.id;
  });

  it('updates event as BOARD_MEMBER (AC-04)', async () => {
    const res = await request(app)
      .put(`/api/v1/events/${eventId}`)
      .set('Authorization', `Bearer ${boardToken}`)
      .send({ title: 'Updated Training', location: 'Halle 2' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Training');
  });

  // AC-08: Push on event update
  it('sends push to RSVP users on update (AC-08)', async () => {
    // Add RSVP
    await prisma.availability.upsert({
      where: { eventId_userId: { eventId, userId: memberUserId } },
      create: { eventId, userId: memberUserId, status: 'AVAILABLE' },
      update: {},
    });

    const spy = jest.spyOn(pushService, 'sendToUsers');

    await request(app)
      .put(`/api/v1/events/${eventId}`)
      .set('Authorization', `Bearer ${boardToken}`)
      .send({ title: 'Changed Again' });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(spy).toHaveBeenCalledWith(
      [memberUserId],
      expect.objectContaining({ title: 'Event geaendert' }),
    );

    spy.mockRestore();
  });
});

// AC-05: DELETE /events/:id (Admin only)
describe('DELETE /api/v1/events/:eventId', () => {
  it('deletes event as ADMIN (AC-05)', async () => {
    const event = await prisma.event.create({
      data: { title: 'Delete Me', type: 'CLUB_EVENT', startDate: new Date('2026-11-01T10:00:00Z'), clubId, createdById: adminUserId },
    });

    const res = await request(app)
      .delete(`/api/v1/events/${event.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  // AC-09: MEMBER cannot delete
  it('rejects BOARD_MEMBER from deleting (AC-09)', async () => {
    const event = await prisma.event.create({
      data: { title: 'No Delete', type: 'TRAINING', startDate: new Date('2026-11-15T18:00:00Z'), clubId, createdById: adminUserId },
    });

    const res = await request(app)
      .delete(`/api/v1/events/${event.id}`)
      .set('Authorization', `Bearer ${boardToken}`);

    expect(res.status).toBe(403);
  });
});

// AC-06: RSVP
describe('PUT /api/v1/events/:eventId/availability', () => {
  let eventId: string;

  beforeAll(async () => {
    const event = await prisma.event.create({
      data: { title: 'RSVP Event', type: 'LEAGUE_MATCH', startDate: new Date('2026-12-01T14:00:00Z'), clubId, createdById: adminUserId },
    });
    eventId = event.id;
  });

  it('sets RSVP as AVAILABLE (AC-06)', async () => {
    const res = await request(app)
      .put(`/api/v1/events/${eventId}/availability`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ eventId, status: 'AVAILABLE', comment: 'Bin dabei' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('AVAILABLE');
    expect(res.body.data.comment).toBe('Bin dabei');
  });

  it('updates RSVP to NOT_AVAILABLE', async () => {
    const res = await request(app)
      .put(`/api/v1/events/${eventId}/availability`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ eventId, status: 'NOT_AVAILABLE' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('NOT_AVAILABLE');
  });
});

// AC-07: Personal Calendar
describe('GET /api/v1/calendar/me', () => {
  let teamId: string;

  beforeAll(async () => {
    // Create team + add member
    const team = await prisma.team.create({ data: { name: 'Calendar Team', type: 'MATCH_TEAM', clubId } });
    teamId = team.id;
    await prisma.teamMember.create({ data: { teamId, userId: memberUserId } });

    // Create team event
    await prisma.event.create({
      data: { title: 'Team Match', type: 'LEAGUE_MATCH', startDate: new Date('2026-06-20T14:00:00Z'), teamId, clubId, createdById: adminUserId },
    });

    // Create club event (should always appear)
    await prisma.event.create({
      data: { title: 'Sommerfest', type: 'CLUB_EVENT', startDate: new Date('2026-07-15T12:00:00Z'), clubId, createdById: adminUserId },
    });
  });

  afterAll(async () => {
    await prisma.teamMember.deleteMany({ where: { teamId } });
    await prisma.event.deleteMany({ where: { teamId } });
    await prisma.team.delete({ where: { id: teamId } });
  });

  it('returns personal calendar with team events + club events (AC-07)', async () => {
    const res = await request(app)
      .get('/api/v1/calendar/me')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    const titles = res.body.data.map((e: { title: string }) => e.title);
    expect(titles).toContain('Team Match');
    expect(titles).toContain('Sommerfest');
  });
});

// AC-10: Multi-Tenant
describe('Multi-Tenant', () => {
  it('does not show other club events (AC-10)', async () => {
    const res = await request(app)
      .get('/api/v1/events')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    const titles = res.body.data.map((e: { title: string }) => e.title);
    expect(titles).not.toContain('Other Club Match');
  });
});
