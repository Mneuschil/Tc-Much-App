import request from 'supertest';
import { prisma } from '../config/database';
import app from '../app';
import { hashPassword, generateAccessToken } from '../services/auth.service';
import * as pushService from '../services/push.service';
import type { UserRole } from '@tennis-club/shared';

const CLUB_CODE = 'TODOTST';
let clubId: string;
let boardToken: string;
let trainerToken: string;
let memberToken: string;
let boardUserId: string;
let trainerId: string;
let memberId: string;
let teamId: string;

beforeAll(async () => {
  const passwordHash = await hashPassword('password123');

  const club = await prisma.club.create({ data: { name: 'Todo Test Club', clubCode: CLUB_CODE } });
  clubId = club.id;

  const boardUser = await prisma.user.create({
    data: {
      email: 'todoboard@test.de', passwordHash, firstName: 'Board', lastName: 'Todo', clubId,
      roles: { create: [{ role: 'BOARD_MEMBER', clubId }, { role: 'MEMBER', clubId }] },
    },
  });
  boardUserId = boardUser.id;

  const trainer = await prisma.user.create({
    data: {
      email: 'todotrainer@test.de', passwordHash, firstName: 'Trainer', lastName: 'Todo', clubId,
      roles: { create: [{ role: 'TRAINER', clubId }, { role: 'MEMBER', clubId }] },
    },
  });
  trainerId = trainer.id;

  const member = await prisma.user.create({
    data: {
      email: 'todomember@test.de', passwordHash, firstName: 'Mitglied', lastName: 'Todo', clubId,
      roles: { create: [{ role: 'MEMBER', clubId }] },
    },
  });
  memberId = member.id;

  const team = await prisma.team.create({
    data: { name: 'Todo Team', type: 'MATCH_TEAM', clubId },
  });
  teamId = team.id;

  boardToken = generateAccessToken({ userId: boardUserId, clubId, roles: ['BOARD_MEMBER', 'MEMBER'] as UserRole[] });
  trainerToken = generateAccessToken({ userId: trainerId, clubId, roles: ['TRAINER', 'MEMBER'] as UserRole[] });
  memberToken = generateAccessToken({ userId: memberId, clubId, roles: ['MEMBER'] as UserRole[] });
});

afterAll(async () => {
  await prisma.todo.deleteMany({ where: { clubId } });
  await prisma.teamMember.deleteMany({ where: { team: { clubId } } });
  await prisma.team.deleteMany({ where: { clubId } });
  await prisma.pushToken.deleteMany({ where: { user: { clubId } } });
  await prisma.userRoleAssignment.deleteMany({ where: { clubId } });
  await prisma.refreshToken.deleteMany({ where: { user: { clubId } } });
  await prisma.user.deleteMany({ where: { clubId } });
  await prisma.club.deleteMany({ where: { clubCode: CLUB_CODE } });
  await prisma.$disconnect();
});

// ─── AC-01: POST /todos (role restricted) ─────────────────────────
describe('POST /api/v1/todos (AC-01)', () => {
  afterEach(async () => {
    await prisma.todo.deleteMany({ where: { clubId } });
  });

  it('BOARD can create todo', async () => {
    const res = await request(app)
      .post('/api/v1/todos')
      .set('Authorization', `Bearer ${boardToken}`)
      .send({
        title: 'Platz 3 reparieren',
        description: 'Netz ist gerissen',
        assigneeId: memberId,
        scope: 'BOARD',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Platz 3 reparieren');
    expect(res.body.data.assignee.id).toBe(memberId);
  });

  it('TRAINER can create todo', async () => {
    const res = await request(app)
      .post('/api/v1/todos')
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({
        title: 'Baelle bestellen',
        assigneeId: trainerId,
        scope: 'TRAINERS',
      });

    expect(res.status).toBe(201);
  });

  it('MEMBER cannot create todo (AC-01)', async () => {
    const res = await request(app)
      .post('/api/v1/todos')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        title: 'Verboten',
        assigneeId: memberId,
        scope: 'BOARD',
      });

    expect(res.status).toBe(403);
  });
});

// ─── AC-02: Scope enforcement ─────────────────────────────────────
describe('Scope validation (AC-02)', () => {
  it('rejects invalid scope', async () => {
    const res = await request(app)
      .post('/api/v1/todos')
      .set('Authorization', `Bearer ${boardToken}`)
      .send({
        title: 'Test',
        assigneeId: memberId,
        scope: 'INVALID',
      });

    expect(res.status).toBe(400);
  });

  it('accepts TEAM scope with teamId', async () => {
    const res = await request(app)
      .post('/api/v1/todos')
      .set('Authorization', `Bearer ${boardToken}`)
      .send({
        title: 'Trikots waschen',
        assigneeId: memberId,
        scope: 'TEAM',
        teamId,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.scope).toBe('TEAM');

    await prisma.todo.deleteMany({ where: { clubId } });
  });
});

// ─── AC-03: GET /todos + GET /todos/me ────────────────────────────
describe('GET /api/v1/todos (AC-03)', () => {
  let todoId: string;

  beforeAll(async () => {
    const todo = await prisma.todo.create({
      data: {
        title: 'Mein Todo',
        assigneeId: memberId,
        scope: 'BOARD',
        clubId,
        createdById: boardUserId,
      },
    });
    todoId = todo.id;

    await prisma.todo.create({
      data: {
        title: 'Trainer Todo',
        assigneeId: trainerId,
        scope: 'TRAINERS',
        clubId,
        createdById: boardUserId,
      },
    });
  });

  afterAll(async () => {
    await prisma.todo.deleteMany({ where: { clubId } });
  });

  it('GET /todos returns filtered todos', async () => {
    const res = await request(app)
      .get('/api/v1/todos?scope=BOARD')
      .set('Authorization', `Bearer ${boardToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.every((t: { scope: string }) => t.scope === 'BOARD')).toBe(true);
  });

  it('GET /todos/me returns only my assigned todos', async () => {
    const res = await request(app)
      .get('/api/v1/todos/me')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Mein Todo');
  });
});

// ─── AC-04: PATCH /todos/:id/status ───────────────────────────────
describe('PATCH /api/v1/todos/:id/status (AC-04)', () => {
  let todoId: string;

  beforeAll(async () => {
    const todo = await prisma.todo.create({
      data: {
        title: 'Toggle Todo',
        assigneeId: memberId,
        scope: 'BOARD',
        clubId,
        createdById: boardUserId,
        status: 'OPEN',
      },
    });
    todoId = todo.id;
  });

  afterAll(async () => {
    await prisma.todo.deleteMany({ where: { clubId } });
  });

  it('toggles OPEN → DONE', async () => {
    const res = await request(app)
      .patch(`/api/v1/todos/${todoId}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'DONE' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('DONE');
  });

  it('toggles DONE → OPEN', async () => {
    const res = await request(app)
      .patch(`/api/v1/todos/${todoId}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'OPEN' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('OPEN');
  });
});

// ─── AC-05: Push an Assignee ──────────────────────────────────────
describe('Push on assignment (AC-05)', () => {
  afterEach(async () => {
    await prisma.todo.deleteMany({ where: { clubId } });
  });

  it('sends push to assignee when different from creator', async () => {
    const spy = jest.spyOn(pushService, 'sendToUsers');

    await request(app)
      .post('/api/v1/todos')
      .set('Authorization', `Bearer ${boardToken}`)
      .send({
        title: 'Push Test',
        assigneeId: memberId,
        scope: 'BOARD',
      });

    expect(spy).toHaveBeenCalledWith(
      [memberId],
      expect.objectContaining({ title: 'Neues Todo' }),
    );

    spy.mockRestore();
  });

  it('does not push when assigning to self', async () => {
    const spy = jest.spyOn(pushService, 'sendToUsers');

    await request(app)
      .post('/api/v1/todos')
      .set('Authorization', `Bearer ${boardToken}`)
      .send({
        title: 'Self Assign',
        assigneeId: boardUserId,
        scope: 'BOARD',
      });

    expect(spy).not.toHaveBeenCalled();

    spy.mockRestore();
  });
});

// ─── AC-06: Dashboard endpoint ────────────────────────────────────
describe('GET /api/v1/todos/dashboard (AC-06)', () => {
  beforeAll(async () => {
    await prisma.todo.createMany({
      data: [
        { title: 'Offen 1', assigneeId: memberId, scope: 'BOARD', clubId, createdById: boardUserId, status: 'OPEN' },
        { title: 'Offen 2', assigneeId: memberId, scope: 'BOARD', clubId, createdById: boardUserId, status: 'OPEN' },
        { title: 'Erledigt', assigneeId: memberId, scope: 'BOARD', clubId, createdById: boardUserId, status: 'DONE' },
        { title: 'Anderer User', assigneeId: trainerId, scope: 'TRAINERS', clubId, createdById: boardUserId, status: 'OPEN' },
      ],
    });
  });

  afterAll(async () => {
    await prisma.todo.deleteMany({ where: { clubId } });
  });

  it('returns only open todos for current user', async () => {
    const res = await request(app)
      .get('/api/v1/todos/dashboard')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data.every((t: { status: string }) => t.status === 'OPEN')).toBe(true);
  });
});
