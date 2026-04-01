import request from 'supertest';
import { prisma } from '../config/database';
import app from '../app';
import { hashPassword, generateAccessToken } from '../services/auth.service';
import * as pushService from '../services/push.service';
import type { UserRole } from '@tennis-club/shared';

const CLUB_CODE = 'FORMTST';
let clubId: string;
let boardToken: string;
let memberToken: string;
let boardUserId: string;
let memberId: string;

beforeAll(async () => {
  const passwordHash = await hashPassword('password123');

  const club = await prisma.club.create({ data: { name: 'Form Test Club', clubCode: CLUB_CODE } });
  clubId = club.id;

  const boardUser = await prisma.user.create({
    data: {
      email: 'formboard@test.de', passwordHash, firstName: 'Board', lastName: 'Form', clubId,
      roles: { create: [{ role: 'BOARD_MEMBER', clubId }, { role: 'MEMBER', clubId }] },
    },
  });
  boardUserId = boardUser.id;

  const member = await prisma.user.create({
    data: {
      email: 'formmember@test.de', passwordHash, firstName: 'Mitglied', lastName: 'Form', clubId,
      roles: { create: [{ role: 'MEMBER', clubId }] },
    },
  });
  memberId = member.id;

  boardToken = generateAccessToken({ userId: boardUserId, clubId, roles: ['BOARD_MEMBER', 'MEMBER'] as UserRole[] });
  memberToken = generateAccessToken({ userId: memberId, clubId, roles: ['MEMBER'] as UserRole[] });
});

afterAll(async () => {
  await prisma.formSubmission.deleteMany({ where: { clubId } });
  await prisma.todo.deleteMany({ where: { clubId } });
  await prisma.pushToken.deleteMany({ where: { user: { clubId } } });
  await prisma.userRoleAssignment.deleteMany({ where: { clubId } });
  await prisma.refreshToken.deleteMany({ where: { user: { clubId } } });
  await prisma.user.deleteMany({ where: { clubId } });
  await prisma.club.deleteMany({ where: { clubCode: CLUB_CODE } });
  await prisma.$disconnect();
});

// ─── AC-01: POST /forms/court-damage + Auto-Todo ──────────────────
describe('POST /api/v1/forms/court-damage (AC-01)', () => {
  let formId: string;

  it('creates court damage report with auto-todo', async () => {
    const res = await request(app)
      .post('/api/v1/forms/court-damage')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        courtNumber: '3',
        description: 'Netz ist gerissen',
        photoUrl: 'https://example.com/photo.jpg',
        urgency: 'HIGH',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('COURT_DAMAGE');
    expect(res.body.data.status).toBe('submitted');
    expect(res.body.data.todo).not.toBeNull();
    expect(res.body.data.todo.title).toContain('Platz 3');
    formId = res.body.data.id;
  });

  // AC-02: Urgency validation
  it('stores urgency in data (AC-02)', async () => {
    const form = await prisma.formSubmission.findUnique({ where: { id: formId } });
    expect(form).not.toBeNull();
    expect((form!.data as { urgency: string }).urgency).toBe('HIGH');
  });

  it('rejects invalid urgency (AC-02)', async () => {
    const res = await request(app)
      .post('/api/v1/forms/court-damage')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        courtNumber: '1',
        description: 'Test',
        photoUrl: 'https://example.com/photo.jpg',
        urgency: 'INVALID',
      });

    expect(res.status).toBe(400);
  });
});

// ─── AC-03: GET /forms/court-damage (BOARD/ADMIN) ─────────────────
describe('GET /api/v1/forms/court-damage (AC-03)', () => {
  it('BOARD can list all court damage reports', async () => {
    const res = await request(app)
      .get('/api/v1/forms/court-damage')
      .set('Authorization', `Bearer ${boardToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].type).toBe('COURT_DAMAGE');
    expect(res.body.data[0].submittedBy).toBeDefined();
  });

  it('MEMBER cannot list reports', async () => {
    const res = await request(app)
      .get('/api/v1/forms/court-damage')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(403);
  });
});

// ─── AC-04 + AC-06: PATCH /status → Push + Status-Flow ───────────
describe('PATCH /api/v1/forms/court-damage/:id/status (AC-04, AC-06)', () => {
  let formId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/forms/court-damage')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        courtNumber: '5',
        description: 'Linien verblasst',
        photoUrl: 'https://example.com/lines.jpg',
        urgency: 'MEDIUM',
      });
    formId = res.body.data.id;
  });

  it('transitions submitted → in_progress with push (AC-04, AC-06)', async () => {
    const spy = jest.spyOn(pushService, 'sendToUsers');

    const res = await request(app)
      .patch(`/api/v1/forms/court-damage/${formId}/status`)
      .set('Authorization', `Bearer ${boardToken}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('in_progress');

    // Push to original submitter
    expect(spy).toHaveBeenCalledWith(
      [memberId],
      expect.objectContaining({ title: 'Platzschaden-Update' }),
    );

    spy.mockRestore();
  });

  it('transitions in_progress → resolved (AC-06)', async () => {
    const res = await request(app)
      .patch(`/api/v1/forms/court-damage/${formId}/status`)
      .set('Authorization', `Bearer ${boardToken}`)
      .send({ status: 'resolved' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('resolved');
  });

  it('rejects invalid transition resolved → submitted (AC-06)', async () => {
    const res = await request(app)
      .patch(`/api/v1/forms/court-damage/${formId}/status`)
      .set('Authorization', `Bearer ${boardToken}`)
      .send({ status: 'submitted' });

    expect(res.status).toBe(400);
  });

  it('rejects skip transition submitted → resolved (AC-06)', async () => {
    // Create new form in submitted state
    const create = await request(app)
      .post('/api/v1/forms/court-damage')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        courtNumber: '7',
        description: 'Test skip',
        photoUrl: 'https://example.com/skip.jpg',
        urgency: 'LOW',
      });

    const res = await request(app)
      .patch(`/api/v1/forms/court-damage/${create.body.data.id}/status`)
      .set('Authorization', `Bearer ${boardToken}`)
      .send({ status: 'resolved' });

    expect(res.status).toBe(400);
  });

  it('MEMBER cannot update status', async () => {
    const create = await request(app)
      .post('/api/v1/forms/court-damage')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        courtNumber: '2',
        description: 'Test member',
        photoUrl: 'https://example.com/m.jpg',
        urgency: 'LOW',
      });

    const res = await request(app)
      .patch(`/api/v1/forms/court-damage/${create.body.data.id}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(403);
  });
});

// ─── AC-05: POST /forms/media-upload ──────────────────────────────
describe('POST /api/v1/forms/media-upload (AC-05)', () => {
  it('creates media upload with category', async () => {
    const res = await request(app)
      .post('/api/v1/forms/media-upload')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        mediaUrls: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
        category: 'Clubfest 2026',
        tag: 'sommer',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('MEDIA_UPLOAD');
    expect((res.body.data.data as { category: string }).category).toBe('Clubfest 2026');
  });

  it('rejects without mediaUrls', async () => {
    const res = await request(app)
      .post('/api/v1/forms/media-upload')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ category: 'Test' });

    expect(res.status).toBe(400);
  });
});
