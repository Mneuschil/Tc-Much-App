import request from 'supertest';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { prisma } from '../config/database';
import app from '../app';
import { hashPassword, generateAccessToken } from '../services/auth.service';
import { env } from '../config/env';
import type { UserRole } from '@tennis-club/shared';

// Override UPLOAD_DIR for tests
const TEST_UPLOAD_DIR = path.join(os.tmpdir(), 'tennis-club-test-uploads');
env.UPLOAD_DIR = TEST_UPLOAD_DIR;

const CLUB_CODE = 'FILETST';
let clubId: string;
let adminToken: string;
let memberToken: string;
let member2Token: string;
let adminUserId: string;
let memberId: string;
let member2Id: string;
let channelId: string;

beforeAll(async () => {
  const passwordHash = await hashPassword('password123');

  const club = await prisma.club.create({ data: { name: 'File Test Club', clubCode: CLUB_CODE } });
  clubId = club.id;

  const adminUser = await prisma.user.create({
    data: {
      email: 'fileadmin@test.de', passwordHash, firstName: 'Admin', lastName: 'File', clubId,
      roles: { create: [{ role: 'CLUB_ADMIN', clubId }, { role: 'MEMBER', clubId }] },
    },
  });
  adminUserId = adminUser.id;

  const member = await prisma.user.create({
    data: {
      email: 'filemember@test.de', passwordHash, firstName: 'Mitglied', lastName: 'File', clubId,
      roles: { create: [{ role: 'MEMBER', clubId }] },
    },
  });
  memberId = member.id;

  const member2 = await prisma.user.create({
    data: {
      email: 'filemember2@test.de', passwordHash, firstName: 'Mitglied2', lastName: 'File', clubId,
      roles: { create: [{ role: 'MEMBER', clubId }] },
    },
  });
  member2Id = member2.id;

  const channel = await prisma.channel.create({
    data: {
      name: 'Testkanal', clubId, createdById: adminUserId,
    },
  });
  channelId = channel.id;

  // Ensure test upload dir exists
  await fs.mkdir(path.join(TEST_UPLOAD_DIR, clubId), { recursive: true });

  adminToken = generateAccessToken({ userId: adminUserId, clubId, roles: ['CLUB_ADMIN', 'MEMBER'] as UserRole[] });
  memberToken = generateAccessToken({ userId: memberId, clubId, roles: ['MEMBER'] as UserRole[] });
  member2Token = generateAccessToken({ userId: member2Id, clubId, roles: ['MEMBER'] as UserRole[] });
});

afterAll(async () => {
  // Clean up uploaded files
  try {
    await fs.rm(TEST_UPLOAD_DIR, { recursive: true, force: true });
  } catch {
    // ignore
  }

  await prisma.file.deleteMany({ where: { clubId } });
  await prisma.fileFolder.deleteMany({ where: { clubId } });
  await prisma.channel.deleteMany({ where: { clubId } });
  await prisma.pushToken.deleteMany({ where: { user: { clubId } } });
  await prisma.userRoleAssignment.deleteMany({ where: { clubId } });
  await prisma.refreshToken.deleteMany({ where: { user: { clubId } } });
  await prisma.user.deleteMany({ where: { clubId } });
  await prisma.club.deleteMany({ where: { clubCode: CLUB_CODE } });
  await prisma.$disconnect();
});

// ─── AC-01: POST /upload (multer, max 5MB) ────────────────────────
describe('POST /api/v1/upload (AC-01)', () => {
  it('uploads a file successfully', async () => {
    const res = await request(app)
      .post('/api/v1/upload')
      .set('Authorization', `Bearer ${memberToken}`)
      .attach('file', Buffer.from('test content'), { filename: 'test.txt', contentType: 'text/plain' })
      .field('channelId', channelId);

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('test.txt');
    expect(res.body.data.url).toContain(`/uploads/${clubId}/`);
    expect(res.body.data.mimeType).toBe('text/plain');
  });

  it('rejects disallowed file type', async () => {
    const res = await request(app)
      .post('/api/v1/upload')
      .set('Authorization', `Bearer ${memberToken}`)
      .attach('file', Buffer.from('#!/bin/bash'), { filename: 'hack.sh', contentType: 'application/x-sh' });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ─── AC-02 + AC-03: Storage path + DB metadata ───────────────────
describe('File storage and metadata (AC-02, AC-03)', () => {
  it('stores file under /uploads/{clubId}/ and creates DB record', async () => {
    const res = await request(app)
      .post('/api/v1/upload')
      .set('Authorization', `Bearer ${memberToken}`)
      .attach('file', Buffer.from('hello world'), { filename: 'readme.txt', contentType: 'text/plain' })
      .field('channelId', channelId);

    expect(res.status).toBe(201);

    // Check DB record
    const dbFile = await prisma.file.findFirst({
      where: { clubId, name: 'readme.txt' },
    });
    expect(dbFile).not.toBeNull();
    expect(dbFile!.url).toContain(`/uploads/${clubId}/`);
    expect(dbFile!.uploadedById).toBe(memberId);
    expect(dbFile!.channelId).toBe(channelId);

    // Check physical file exists
    const filePath = path.join(env.UPLOAD_DIR, dbFile!.url.replace('/uploads/', ''));
    const stat = await fs.stat(filePath);
    expect(stat.isFile()).toBe(true);
  });
});

// ─── AC-04: POST /folders (BOARD/ADMIN) ──────────────────────────
describe('POST /api/v1/files/folders (AC-04)', () => {
  afterEach(async () => {
    await prisma.fileFolder.deleteMany({ where: { clubId } });
  });

  it('ADMIN can create folder', async () => {
    const res = await request(app)
      .post('/api/v1/files/folders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Dokumente', channelId });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Dokumente');
  });

  it('MEMBER cannot create folder', async () => {
    const res = await request(app)
      .post('/api/v1/files/folders')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Verboten', channelId });

    expect(res.status).toBe(403);
  });
});

// ─── AC-05: GET /channels/:id/files ──────────────────────────────
describe('GET /api/v1/files/channel/:channelId (AC-05)', () => {
  beforeAll(async () => {
    await prisma.file.create({
      data: {
        name: 'channelfile.pdf',
        url: `/uploads/${clubId}/channelfile.pdf`,
        mimeType: 'application/pdf',
        size: 1024,
        clubId,
        uploadedById: memberId,
        channelId,
      },
    });
  });

  it('returns files for channel', async () => {
    const res = await request(app)
      .get(`/api/v1/files/channel/${channelId}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.some((f: { name: string }) => f.name === 'channelfile.pdf')).toBe(true);
  });
});

// ─── AC-06: Image compression (sharp, max 1920px) ────────────────
describe('Image compression (AC-06)', () => {
  it('compresses uploaded image', async () => {
    // Create a simple 100x100 PNG using sharp
    const testImage = await (await import('sharp')).default({
      create: { width: 2500, height: 2000, channels: 3, background: { r: 255, g: 0, b: 0 } },
    }).png().toBuffer();

    const res = await request(app)
      .post('/api/v1/upload')
      .set('Authorization', `Bearer ${memberToken}`)
      .attach('file', testImage, { filename: 'large.png', contentType: 'image/png' })
      .field('channelId', channelId);

    expect(res.status).toBe(201);
    expect(res.body.data.mimeType).toBe('image/jpeg'); // Converted to JPEG
    // Compressed size should be much less than the original PNG
    expect(res.body.data.size).toBeLessThan(testImage.length);
  });
});

// ─── AC-07: DELETE only uploader or ADMIN ─────────────────────────
describe('DELETE /api/v1/upload/:fileId (AC-07)', () => {
  let uploaderFileId: string;

  beforeEach(async () => {
    const file = await prisma.file.create({
      data: {
        name: 'deleteme.txt',
        url: `/uploads/${clubId}/deleteme.txt`,
        mimeType: 'text/plain',
        size: 100,
        clubId,
        uploadedById: memberId,
      },
    });
    uploaderFileId = file.id;
  });

  afterEach(async () => {
    await prisma.file.deleteMany({ where: { clubId, name: 'deleteme.txt' } });
  });

  it('uploader can delete own file', async () => {
    const res = await request(app)
      .delete(`/api/v1/upload/${uploaderFileId}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.deleted).toBe(true);
  });

  it('other member cannot delete file', async () => {
    const res = await request(app)
      .delete(`/api/v1/upload/${uploaderFileId}`)
      .set('Authorization', `Bearer ${member2Token}`);

    expect(res.status).toBe(403);
  });

  it('ADMIN can delete any file', async () => {
    const res = await request(app)
      .delete(`/api/v1/upload/${uploaderFileId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.deleted).toBe(true);
  });
});
