import request from 'supertest';
import { prisma } from '../config/database';
import app from '../app';
import { hashPassword, generateAccessToken } from '../services/auth.service';
import * as pushService from '../services/push.service';
import { env } from '../config/env';
import type { UserRole } from '@tennis-club/shared';

const CLUB_CODE = 'TRAINTST';
let clubId: string;
let trainerToken: string;
let boardToken: string;
let memberToken: string;
let trainerId: string;
let boardUserId: string;
let member1Id: string;
let member2Id: string;
let trainingGroupId: string;

beforeAll(async () => {
  const passwordHash = await hashPassword('password123');

  const club = await prisma.club.create({
    data: { name: 'Training Test Club', clubCode: CLUB_CODE },
  });
  clubId = club.id;

  const trainer = await prisma.user.create({
    data: {
      email: 'traintrainer@test.de',
      passwordHash,
      firstName: 'Trainer',
      lastName: 'Test',
      clubId,
      roles: {
        create: [
          { role: 'TRAINER', clubId },
          { role: 'MEMBER', clubId },
        ],
      },
    },
  });
  trainerId = trainer.id;

  const boardUser = await prisma.user.create({
    data: {
      email: 'trainboard@test.de',
      passwordHash,
      firstName: 'Board',
      lastName: 'Test',
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

  const m1 = await prisma.user.create({
    data: {
      email: 'trainm1@test.de',
      passwordHash,
      firstName: 'Mitglied1',
      lastName: 'Test',
      clubId,
      roles: { create: [{ role: 'MEMBER', clubId }] },
    },
  });
  member1Id = m1.id;

  const m2 = await prisma.user.create({
    data: {
      email: 'trainm2@test.de',
      passwordHash,
      firstName: 'Mitglied2',
      lastName: 'Test',
      clubId,
      roles: { create: [{ role: 'MEMBER', clubId }] },
    },
  });
  member2Id = m2.id;

  // Create training group
  const group = await prisma.team.create({
    data: {
      name: 'Testgruppe',
      type: 'TRAINING_GROUP',
      clubId,
      members: {
        create: [{ userId: member1Id }, { userId: member2Id }],
      },
    },
  });
  trainingGroupId = group.id;

  trainerToken = generateAccessToken({
    userId: trainerId,
    clubId,
    roles: ['TRAINER', 'MEMBER'] as UserRole[],
  });
  boardToken = generateAccessToken({
    userId: boardUserId,
    clubId,
    roles: ['BOARD_MEMBER', 'MEMBER'] as UserRole[],
  });
  memberToken = generateAccessToken({ userId: member1Id, clubId, roles: ['MEMBER'] as UserRole[] });
});

afterAll(async () => {
  await prisma.trainingAttendance.deleteMany({ where: { event: { clubId } } });
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

// ─── AC-01: POST /events/:id/attendance ───────────────────────────
describe('POST /api/v1/events/:eventId/attendance (AC-01)', () => {
  let futureEventId: string;

  beforeAll(async () => {
    // Training 48h in the future → well before 5h deadline
    const event = await prisma.event.create({
      data: {
        title: 'Training Montag',
        type: 'TRAINING',
        startDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
        teamId: trainingGroupId,
        clubId,
        createdById: trainerId,
      },
    });
    futureEventId = event.id;
  });

  it('member can set attendance YES', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${futureEventId}/attendance`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ attending: true });

    expect(res.status).toBe(201);
    expect(res.body.data.attending).toBe(true);
    expect(res.body.data.userId).toBe(member1Id);
  });

  it('member can change to NO', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${futureEventId}/attendance`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ attending: false });

    expect(res.status).toBe(201);
    expect(res.body.data.attending).toBe(false);
  });
});

// ─── AC-02: Deadline 5h vor Training ──────────────────────────────
describe('Deadline enforcement (AC-02)', () => {
  let pastDeadlineEventId: string;

  beforeAll(async () => {
    // Training 2h in the future → past the 5h deadline
    const event = await prisma.event.create({
      data: {
        title: 'Training gleich',
        type: 'TRAINING',
        startDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
        teamId: trainingGroupId,
        clubId,
        createdById: trainerId,
      },
    });
    pastDeadlineEventId = event.id;
  });

  it('returns 400 when deadline passed', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${pastDeadlineEventId}/attendance`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ attending: true });

    expect(res.status).toBe(400);
  });
});

// ─── AC-03: GET /events/:id/attendance (role restricted) ──────────
describe('GET /api/v1/events/:eventId/attendance (AC-03)', () => {
  let eventId: string;

  beforeAll(async () => {
    const event = await prisma.event.create({
      data: {
        title: 'Training Dienstag',
        type: 'TRAINING',
        startDate: new Date(Date.now() + 72 * 60 * 60 * 1000),
        teamId: trainingGroupId,
        clubId,
        createdById: trainerId,
      },
    });
    eventId = event.id;

    await prisma.trainingAttendance.create({
      data: {
        eventId,
        userId: member1Id,
        attending: true,
        deadlineAt: new Date(Date.now() + 67 * 60 * 60 * 1000),
      },
    });
  });

  it('TRAINER can view attendance list', async () => {
    const res = await request(app)
      .get(`/api/v1/events/${eventId}/attendance`)
      .set('Authorization', `Bearer ${trainerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].user.firstName).toBe('Mitglied1');
  });

  it('BOARD can view attendance list', async () => {
    const res = await request(app)
      .get(`/api/v1/events/${eventId}/attendance`)
      .set('Authorization', `Bearer ${boardToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('MEMBER cannot view attendance list', async () => {
    const res = await request(app)
      .get(`/api/v1/events/${eventId}/attendance`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(403);
  });
});

// ─── AC-04: GET /training/overview ────────────────────────────────
describe('GET /api/v1/training/overview (AC-04)', () => {
  it('TRAINER gets overview with stats', async () => {
    const res = await request(app)
      .get('/api/v1/training/overview')
      .set('Authorization', `Bearer ${trainerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      expect(res.body.data[0].stats).toBeDefined();
      expect(res.body.data[0].stats).toHaveProperty('attending');
      expect(res.body.data[0].stats).toHaveProperty('notAttending');
      expect(res.body.data[0].stats).toHaveProperty('noResponse');
    }
  });

  it('MEMBER cannot access overview', async () => {
    const res = await request(app)
      .get('/api/v1/training/overview')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(403);
  });
});

// ─── C-05: Training without team does not crash sendReminders ─────
describe('sendReminders with teamless training (C-05)', () => {
  let teamlessEventId: string;

  beforeAll(async () => {
    // Create a training WITHOUT team assignment — this is the C-05 crash path
    const event = await prisma.event.create({
      data: {
        title: 'Teamloses Training',
        type: 'TRAINING',
        startDate: new Date(Date.now() + 10 * 60 * 60 * 1000),
        clubId,
        createdById: trainerId,
        // teamId deliberately omitted
      },
    });
    teamlessEventId = event.id;
  });

  afterAll(async () => {
    await prisma.trainingAttendance.deleteMany({ where: { eventId: teamlessEventId } });
    await prisma.event.delete({ where: { id: teamlessEventId } });
  });

  it('does not crash when training.team is null (C-05)', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/training-reminder')
      .set('Authorization', `Bearer ${env.WEBHOOK_SECRET}`);

    // Should succeed — the teamless training is simply skipped
    expect(res.status).toBe(200);
  });
});

// ─── AC-05: Reminder webhook ──────────────────────────────────────
describe('POST /api/v1/webhooks/training-reminder (AC-05)', () => {
  beforeAll(async () => {
    // Create training in next 24h with team members but no attendance response
    await prisma.event.create({
      data: {
        title: 'Training morgen',
        type: 'TRAINING',
        startDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
        teamId: trainingGroupId,
        clubId,
        createdById: trainerId,
      },
    });
  });

  it('sends reminders to members without response', async () => {
    const spy = jest.spyOn(pushService, 'sendToUsers');

    const res = await request(app)
      .post('/api/v1/webhooks/training-reminder')
      .set('Authorization', `Bearer ${env.WEBHOOK_SECRET}`);

    expect(res.status).toBe(200);
    expect(res.body.data.reminded).toBeGreaterThanOrEqual(1);
    expect(res.body.data.trainingsChecked).toBeGreaterThanOrEqual(1);

    expect(spy).toHaveBeenCalledWith(
      expect.arrayContaining([member1Id]),
      expect.objectContaining({ title: 'Training-Erinnerung' }),
    );

    spy.mockRestore();
  });
});
