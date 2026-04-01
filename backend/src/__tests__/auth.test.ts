import request from 'supertest';
import { prisma } from '../config/database';
import app from '../app';

const CLUB_CODE = 'TESTCLUB';
let clubId: string;

beforeAll(async () => {
  // Create a test club
  const club = await prisma.club.upsert({
    where: { clubCode: CLUB_CODE },
    update: {},
    create: {
      name: 'Test Club',
      clubCode: CLUB_CODE,
    },
  });
  clubId = club.id;
});

afterAll(async () => {
  // Cleanup test data
  await prisma.userRoleAssignment.deleteMany({ where: { clubId } });
  await prisma.refreshToken.deleteMany({
    where: { user: { clubId } },
  });
  await prisma.user.deleteMany({ where: { clubId } });
  await prisma.club.deleteMany({ where: { clubCode: CLUB_CODE } });
  await prisma.$disconnect();
});

// ─── auth-1: Register creates user with MEMBER role + tokens ────────
describe('POST /api/v1/auth/register', () => {
  it('creates user with MEMBER role and returns tokens (auth-1)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'testuser@test.de',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        clubCode: CLUB_CODE,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('testuser@test.de');
    expect(res.body.data.user.roles).toContain('MEMBER');
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
  });

  // ─── auth-2: Rejects duplicate email ──────────────────────────────
  it('rejects duplicate email in same club (auth-2)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'testuser@test.de',
        password: 'password123',
        firstName: 'Test',
        lastName: 'Duplicate',
        clubCode: CLUB_CODE,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  // ─── auth-3: Rejects invalid club code ────────────────────────────
  it('rejects invalid club code (auth-3)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'other@test.de',
        password: 'password123',
        firstName: 'Other',
        lastName: 'User',
        clubCode: 'INVALID_CODE',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─── Login tests ────────────────────────────────────────────────────
describe('POST /api/v1/auth/login', () => {
  // ─── auth-4: Login returns user with roles + tokens ───────────────
  it('returns user with roles array and valid tokens (auth-4)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'testuser@test.de',
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('testuser@test.de');
    expect(Array.isArray(res.body.data.user.roles)).toBe(true);
    expect(res.body.data.user.roles).toContain('MEMBER');
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
  });

  // ─── auth-5: Rejects wrong password ───────────────────────────────
  it('rejects wrong password (auth-5)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'testuser@test.de',
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // ─── auth-6: Rejects non-existent email ───────────────────────────
  it('rejects non-existent email (auth-6)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nobody@test.de',
        password: 'password123',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ─── Token refresh tests ────────────────────────────────────────────
describe('POST /api/v1/auth/refresh', () => {
  let refreshToken: string;
  let accessToken: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'testuser@test.de', password: 'password123' });
    refreshToken = res.body.data.tokens.refreshToken;
    accessToken = res.body.data.tokens.accessToken;
  });

  // ─── auth-7: Refresh returns new tokens ───────────────────────────
  it('returns new token pair and invalidates old refresh token (auth-7)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
    // New tokens should be different
    expect(res.body.data.tokens.refreshToken).not.toBe(refreshToken);

    // Old refresh token should be invalid now (rotation)
    const res2 = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res2.status).toBe(401);
  });

  // ─── auth-8: Rejects invalid refresh token ────────────────────────
  it('rejects invalid refresh token (auth-8)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'invalid-token-string' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ─── Logout test ────────────────────────────────────────────────────
describe('POST /api/v1/auth/logout', () => {
  // ─── auth-9: Logout invalidates token ─────────────────────────────
  it('invalidates refresh token (auth-9)', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'testuser@test.de', password: 'password123' });
    const token = loginRes.body.data.tokens.refreshToken;

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken: token });

    expect(logoutRes.status).toBe(200);

    // Token should be invalid after logout
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: token });

    expect(refreshRes.status).toBe(401);
  });
});

// ─── Protected endpoint tests ───────────────────────────────────────
describe('Auth Middleware', () => {
  let validToken: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'testuser@test.de', password: 'password123' });
    validToken = res.body.data.tokens.accessToken;
  });

  // ─── auth-10: Rejects requests without token ─────────────────────
  it('rejects requests without token (auth-10)', async () => {
    const res = await request(app).get('/api/v1/channels');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // ─── auth-11: Rejects invalid tokens ──────────────────────────────
  it('rejects expired/invalid tokens (auth-11)', async () => {
    const res = await request(app)
      .get('/api/v1/channels')
      .set('Authorization', 'Bearer invalid.jwt.token');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // ─── auth-12: Protected endpoint works with valid token ───────────
  it('protected endpoint works with valid token (auth-12)', async () => {
    const res = await request(app)
      .get('/api/v1/channels')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
