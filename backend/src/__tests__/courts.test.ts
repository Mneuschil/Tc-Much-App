import request from 'supertest';
import { prisma } from '../config/database';
import app from '../app';
import { hashPassword, generateAccessToken } from '../services/auth.service';
import type { UserRole } from '@tennis-club/shared';

const CLUB_CODE = 'CRTSTEST';
let clubId: string;
let otherClubId: string;
let memberToken: string;
let memberUserId: string;

const TODAY = new Date('2026-04-15T00:00:00Z');
const EMPTY_DAY = '2026-04-20';

beforeAll(async () => {
  const passwordHash = await hashPassword('password123');

  const club = await prisma.club.create({ data: { name: 'Courts Test', clubCode: CLUB_CODE } });
  clubId = club.id;
  const otherClub = await prisma.club.create({
    data: { name: 'Courts Other', clubCode: 'CRTSOTH1' },
  });
  otherClubId = otherClub.id;

  const member = await prisma.user.create({
    data: {
      email: 'crtsmember@test.de',
      passwordHash,
      firstName: 'Court',
      lastName: 'Member',
      clubId,
      roles: { create: [{ role: 'MEMBER', clubId }] },
    },
  });
  memberUserId = member.id;

  const otherUser = await prisma.user.create({
    data: {
      email: 'crtsother@test.de',
      passwordHash,
      firstName: 'Other',
      lastName: 'User',
      clubId: otherClubId,
      roles: { create: [{ role: 'MEMBER', clubId: otherClubId }] },
    },
  });

  memberToken = generateAccessToken({
    userId: memberUserId,
    clubId,
    roles: ['MEMBER'] as UserRole[],
  });

  // Today: 1 training (Platz 1), 1 league match (Platz 3), 1 ranking match (Platz 5)
  await prisma.event.createMany({
    data: [
      {
        title: 'Training Damen',
        type: 'TRAINING',
        court: 'Platz 1',
        startDate: new Date('2026-04-15T08:00:00Z'),
        endDate: new Date('2026-04-15T09:30:00Z'),
        clubId,
        createdById: memberUserId,
      },
      {
        title: 'Bezirksliga vs. TC Köln',
        type: 'LEAGUE_MATCH',
        court: 'Platz 3',
        startDate: new Date('2026-04-15T14:00:00Z'),
        endDate: new Date('2026-04-15T18:00:00Z'),
        clubId,
        createdById: memberUserId,
      },
      {
        title: 'Rangliste',
        type: 'RANKING_MATCH',
        court: 'Platz 5',
        startDate: new Date('2026-04-15T18:00:00Z'),
        endDate: new Date('2026-04-15T20:00:00Z'),
        clubId,
        createdById: memberUserId,
      },
      // Event without court — must be excluded
      {
        title: 'Vorstandssitzung',
        type: 'CLUB_EVENT',
        court: null,
        startDate: new Date('2026-04-15T19:00:00Z'),
        clubId,
        createdById: memberUserId,
      },
      // Event in other club — multi-tenant
      {
        title: 'Other Club Training',
        type: 'TRAINING',
        court: 'Platz 1',
        startDate: new Date('2026-04-15T10:00:00Z'),
        endDate: new Date('2026-04-15T11:00:00Z'),
        clubId: otherClubId,
        createdById: otherUser.id,
      },
    ],
  });
});

afterAll(async () => {
  await prisma.event.deleteMany({ where: { clubId: { in: [clubId, otherClubId] } } });
  await prisma.userRoleAssignment.deleteMany({ where: { clubId: { in: [clubId, otherClubId] } } });
  await prisma.refreshToken.deleteMany({
    where: { user: { clubId: { in: [clubId, otherClubId] } } },
  });
  await prisma.user.deleteMany({ where: { clubId: { in: [clubId, otherClubId] } } });
  await prisma.club.deleteMany({ where: { clubCode: { in: [CLUB_CODE, 'CRTSOTH1'] } } });
  await prisma.$disconnect();
});

describe('GET /api/v1/courts/occupancy', () => {
  it('returns all slots with court for the given day', async () => {
    const res = await request(app)
      .get(`/api/v1/courts/occupancy?date=${TODAY.toISOString().slice(0, 10)}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(3);
    const courts = res.body.data.map((s: { court: number }) => s.court).sort();
    expect(courts).toEqual([1, 3, 5]);
    const categories = res.body.data.map((s: { category: string }) => s.category).sort();
    expect(categories).toEqual(['MEDENSPIEL', 'MEDENSPIEL', 'TRAINING']);
  });

  it('excludes events from other clubs (multi-tenant)', async () => {
    const res = await request(app)
      .get(`/api/v1/courts/occupancy?date=${TODAY.toISOString().slice(0, 10)}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.body.data.every((s: { title: string }) => s.title !== 'Other Club Training')).toBe(
      true,
    );
  });

  it('returns empty array for day without occupancy', async () => {
    const res = await request(app)
      .get(`/api/v1/courts/occupancy?date=${EMPTY_DAY}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('rejects invalid date with 400', async () => {
    const res = await request(app)
      .get('/api/v1/courts/occupancy?date=not-a-date')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/courts/occupancy?date=2026-04-15');
    expect(res.status).toBe(401);
  });
});
