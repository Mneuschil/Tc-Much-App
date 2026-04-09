import request from 'supertest';
import { prisma } from '../config/database';
import app from '../app';
import { hashPassword, generateAccessToken } from '../services/auth.service';
import type { UserRole } from '@tennis-club/shared';

const CLUB_CODE = 'CHANTEST';
let clubId: string;
let otherClubId: string;
let adminToken: string;
let boardToken: string;
let memberToken: string;
let otherClubToken: string;
let adminUserId: string;
let memberUserId: string;
let publicChannelId: string;
let restrictedChannelId: string;

beforeAll(async () => {
  const passwordHash = await hashPassword('password123');

  const club = await prisma.club.create({
    data: { name: 'Channel Test Club', clubCode: CLUB_CODE },
  });
  clubId = club.id;

  const otherClub = await prisma.club.create({
    data: { name: 'Other Channel Club', clubCode: 'CHANOTH' },
  });
  otherClubId = otherClub.id;

  const adminUser = await prisma.user.create({
    data: {
      email: 'chanadmin@test.de',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Chan',
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
      email: 'chanboard@test.de',
      passwordHash,
      firstName: 'Board',
      lastName: 'Chan',
      clubId,
      roles: {
        create: [
          { role: 'BOARD_MEMBER', clubId },
          { role: 'MEMBER', clubId },
        ],
      },
    },
  });

  const memberUser = await prisma.user.create({
    data: {
      email: 'chanmember@test.de',
      passwordHash,
      firstName: 'Member',
      lastName: 'Chan',
      clubId,
      roles: { create: [{ role: 'MEMBER', clubId }] },
    },
  });
  memberUserId = memberUser.id;

  const otherUser = await prisma.user.create({
    data: {
      email: 'chanother@test.de',
      passwordHash,
      firstName: 'Other',
      lastName: 'Chan',
      clubId: otherClubId,
      roles: { create: [{ role: 'MEMBER', clubId: otherClubId }] },
    },
  });

  adminToken = generateAccessToken({
    userId: adminUser.id,
    clubId,
    roles: ['CLUB_ADMIN', 'MEMBER'] as UserRole[],
  });
  boardToken = generateAccessToken({
    userId: boardUser.id,
    clubId,
    roles: ['BOARD_MEMBER', 'MEMBER'] as UserRole[],
  });
  memberToken = generateAccessToken({
    userId: memberUser.id,
    clubId,
    roles: ['MEMBER'] as UserRole[],
  });
  otherClubToken = generateAccessToken({
    userId: otherUser.id,
    clubId: otherClubId,
    roles: ['MEMBER'] as UserRole[],
  });

  // Create test channels
  const pubChannel = await prisma.channel.create({
    data: { name: 'Public Test', visibility: 'PUBLIC', clubId, createdById: adminUserId },
  });
  publicChannelId = pubChannel.id;

  const resChannel = await prisma.channel.create({
    data: { name: 'Restricted Test', visibility: 'RESTRICTED', clubId, createdById: adminUserId },
  });
  restrictedChannelId = resChannel.id;

  // Add member to restricted channel explicitly
  await prisma.channelMember.create({
    data: { channelId: restrictedChannelId, userId: memberUserId },
  });
});

afterAll(async () => {
  await prisma.channelMute.deleteMany({
    where: { channel: { clubId: { in: [clubId, otherClubId] } } },
  });
  await prisma.channelMember.deleteMany({
    where: { channel: { clubId: { in: [clubId, otherClubId] } } },
  });
  await prisma.message.deleteMany({
    where: { channel: { clubId: { in: [clubId, otherClubId] } } },
  });
  await prisma.channel.deleteMany({ where: { clubId: { in: [clubId, otherClubId] } } });
  await prisma.userRoleAssignment.deleteMany({ where: { clubId: { in: [clubId, otherClubId] } } });
  await prisma.refreshToken.deleteMany({
    where: { user: { clubId: { in: [clubId, otherClubId] } } },
  });
  await prisma.user.deleteMany({ where: { clubId: { in: [clubId, otherClubId] } } });
  await prisma.club.deleteMany({ where: { clubCode: { in: [CLUB_CODE, 'CHANOTH'] } } });
  await prisma.$disconnect();
});

// AC-01: GET /channels returns visible channels
describe('GET /api/v1/channels', () => {
  it('returns PUBLIC + assigned RESTRICTED channels for MEMBER (AC-01, AC-03)', async () => {
    const res = await request(app)
      .get('/api/v1/channels')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const names = res.body.data.map((c: { name: string }) => c.name);
    expect(names).toContain('Public Test');
    expect(names).toContain('Restricted Test'); // member was explicitly added
  });

  // AC-02: Admin/Board see all channels
  it('returns ALL channels for BOARD_MEMBER (AC-02)', async () => {
    const res = await request(app)
      .get('/api/v1/channels')
      .set('Authorization', `Bearer ${boardToken}`);

    expect(res.status).toBe(200);
    const names = res.body.data.map((c: { name: string }) => c.name);
    expect(names).toContain('Public Test');
    expect(names).toContain('Restricted Test');
  });

  // AC-03: MEMBER without membership cannot see unassigned RESTRICTED
  it('MEMBER does not see RESTRICTED channels without membership (AC-03)', async () => {
    // Create a restricted channel without member assignment
    const hidden = await prisma.channel.create({
      data: { name: 'Hidden Channel', visibility: 'RESTRICTED', clubId, createdById: adminUserId },
    });

    const res = await request(app)
      .get('/api/v1/channels')
      .set('Authorization', `Bearer ${memberToken}`);

    const names = res.body.data.map((c: { name: string }) => c.name);
    expect(names).not.toContain('Hidden Channel');

    // Cleanup
    await prisma.channel.delete({ where: { id: hidden.id } });
  });
});

// AC-04: POST /channels creates channel (Board/Admin only)
describe('POST /api/v1/channels', () => {
  it('creates channel as BOARD_MEMBER (AC-04)', async () => {
    const res = await request(app)
      .post('/api/v1/channels')
      .set('Authorization', `Bearer ${boardToken}`)
      .send({ name: 'New Channel', visibility: 'PUBLIC' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('New Channel');
    expect(res.body.data.clubId).toBe(clubId);

    // Cleanup
    await prisma.channel.delete({ where: { id: res.body.data.id } });
  });

  it('rejects MEMBER from creating channel', async () => {
    const res = await request(app)
      .post('/api/v1/channels')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Fail Channel', visibility: 'PUBLIC' });

    expect(res.status).toBe(403);
  });
});

// AC-05 & AC-06: Subchannels
describe('Subchannels', () => {
  it('creates subchannel with parentChannelId (AC-05)', async () => {
    const res = await request(app)
      .post(`/api/v1/channels/${publicChannelId}/subchannels`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Sub Channel', visibility: 'PUBLIC' });

    expect(res.status).toBe(201);
    expect(res.body.data.parentChannelId).toBe(publicChannelId);

    // Cleanup
    await prisma.channel.delete({ where: { id: res.body.data.id } });
  });

  it('rejects nested subchannel (max 1 level) (AC-06)', async () => {
    // Create a subchannel first
    const sub = await prisma.channel.create({
      data: {
        name: 'Level 1 Sub',
        visibility: 'PUBLIC',
        clubId,
        createdById: adminUserId,
        parentChannelId: publicChannelId,
      },
    });

    const res = await request(app)
      .post(`/api/v1/channels/${sub.id}/subchannels`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Level 2 Sub', visibility: 'PUBLIC' });

    expect(res.status).toBe(500); // Error thrown by service
    expect(res.body.success).toBe(false);

    // Cleanup
    await prisma.channel.delete({ where: { id: sub.id } });
  });
});

// AC-07: PUT /channels/:id
describe('PUT /api/v1/channels/:channelId', () => {
  it('updates channel as BOARD_MEMBER (AC-07)', async () => {
    const res = await request(app)
      .put(`/api/v1/channels/${publicChannelId}`)
      .set('Authorization', `Bearer ${boardToken}`)
      .send({ name: 'Updated Public', description: 'New description' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Public');
    expect(res.body.data.description).toBe('New description');

    // Reset name
    await prisma.channel.update({
      where: { id: publicChannelId },
      data: { name: 'Public Test', description: null },
    });
  });

  it('rejects MEMBER from updating', async () => {
    const res = await request(app)
      .put(`/api/v1/channels/${publicChannelId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Hacked' });

    expect(res.status).toBe(403);
  });
});

// AC-08: DELETE /channels/:id (CLUB_ADMIN only)
describe('DELETE /api/v1/channels/:channelId', () => {
  it('deletes channel as CLUB_ADMIN (AC-08)', async () => {
    const ch = await prisma.channel.create({
      data: { name: 'To Delete', visibility: 'PUBLIC', clubId, createdById: adminUserId },
    });

    const res = await request(app)
      .delete(`/api/v1/channels/${ch.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const archived = await prisma.channel.findUnique({ where: { id: ch.id } });
    expect(archived).not.toBeNull();
    expect(archived!.isArchived).toBe(true);
  });

  it('rejects BOARD_MEMBER from deleting', async () => {
    const ch = await prisma.channel.create({
      data: { name: 'Board No Delete', visibility: 'PUBLIC', clubId, createdById: adminUserId },
    });

    const res = await request(app)
      .delete(`/api/v1/channels/${ch.id}`)
      .set('Authorization', `Bearer ${boardToken}`);

    expect(res.status).toBe(403);

    // Cleanup
    await prisma.channel.delete({ where: { id: ch.id } });
  });
});

// AC-09: POST /channels/:id/mute toggles mute
describe('POST /api/v1/channels/:channelId/mute', () => {
  it('toggles mute on and off (AC-09)', async () => {
    // Mute
    const res1 = await request(app)
      .post(`/api/v1/channels/${publicChannelId}/mute`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res1.status).toBe(200);
    expect(res1.body.data.muted).toBe(true);

    // Unmute
    const res2 = await request(app)
      .post(`/api/v1/channels/${publicChannelId}/mute`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res2.status).toBe(200);
    expect(res2.body.data.muted).toBe(false);
  });
});

// AC-10: Multi-Tenant isolation
describe('Multi-Tenant', () => {
  it('other club user cannot see channels (AC-10)', async () => {
    const res = await request(app)
      .get('/api/v1/channels')
      .set('Authorization', `Bearer ${otherClubToken}`);

    expect(res.status).toBe(200);
    const names = res.body.data.map((c: { name: string }) => c.name);
    expect(names).not.toContain('Public Test');
    expect(names).not.toContain('Restricted Test');
  });
});
