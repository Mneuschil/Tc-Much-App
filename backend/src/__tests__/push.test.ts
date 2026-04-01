import request from 'supertest';
import { prisma } from '../config/database';
import app from '../app';
import { hashPassword, generateAccessToken } from '../services/auth.service';
import * as pushService from '../services/push.service';
import type { UserRole } from '@tennis-club/shared';

// expo-server-sdk is globally mocked via jest.config.ts moduleNameMapper

const CLUB_CODE = 'PUSHTEST';
let clubId: string;
let memberUserId: string;
let member2UserId: string;
let memberToken: string;
let member2Token: string;
let channelId: string;
let teamId: string;

const VALID_TOKEN_1 = 'ExponentPushToken[push1-test-token]';
const VALID_TOKEN_2 = 'ExponentPushToken[push2-test-token]';

beforeAll(async () => {
  const passwordHash = await hashPassword('password123');

  const club = await prisma.club.create({ data: { name: 'Push Test Club', clubCode: CLUB_CODE } });
  clubId = club.id;

  const memberUser = await prisma.user.create({
    data: {
      email: 'pushmember@test.de', passwordHash, firstName: 'Push', lastName: 'Member', clubId,
      roles: { create: [{ role: 'MEMBER', clubId }] },
    },
  });
  memberUserId = memberUser.id;

  const member2User = await prisma.user.create({
    data: {
      email: 'pushmember2@test.de', passwordHash, firstName: 'Push2', lastName: 'Member', clubId,
      roles: { create: [{ role: 'MEMBER', clubId }] },
    },
  });
  member2UserId = member2User.id;

  memberToken = generateAccessToken({ userId: memberUser.id, clubId, roles: ['MEMBER'] as UserRole[] });
  member2Token = generateAccessToken({ userId: member2User.id, clubId, roles: ['MEMBER'] as UserRole[] });

  const channel = await prisma.channel.create({
    data: { name: 'Push Channel', visibility: 'PUBLIC', clubId, createdById: memberUserId },
  });
  channelId = channel.id;

  const team = await prisma.team.create({
    data: { name: 'Push Team', type: 'MATCH_TEAM', clubId },
  });
  teamId = team.id;

  await prisma.teamMember.create({
    data: { teamId, userId: memberUserId },
  });
  await prisma.teamMember.create({
    data: { teamId, userId: member2UserId },
  });
});

afterAll(async () => {
  await prisma.pushToken.deleteMany({ where: { user: { clubId } } });
  await prisma.teamMember.deleteMany({ where: { team: { clubId } } });
  await prisma.team.deleteMany({ where: { clubId } });
  await prisma.messageReaction.deleteMany({ where: { message: { channel: { clubId } } } });
  await prisma.message.deleteMany({ where: { channel: { clubId } } });
  await prisma.channelMute.deleteMany({ where: { channel: { clubId } } });
  await prisma.channelMember.deleteMany({ where: { channel: { clubId } } });
  await prisma.channel.deleteMany({ where: { clubId } });
  await prisma.userRoleAssignment.deleteMany({ where: { clubId } });
  await prisma.refreshToken.deleteMany({ where: { user: { clubId } } });
  await prisma.user.deleteMany({ where: { clubId } });
  await prisma.club.deleteMany({ where: { clubCode: CLUB_CODE } });
  await prisma.$disconnect();
});

// AC-01: POST /push-tokens registers token
describe('POST /api/v1/push', () => {
  afterEach(async () => {
    await prisma.pushToken.deleteMany({ where: { user: { clubId } } });
  });

  it('registers push token with platform (AC-01)', async () => {
    const res = await request(app)
      .post('/api/v1/push')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ token: VALID_TOKEN_1, platform: 'IOS' });

    expect(res.status).toBe(201);
    expect(res.body.data.token).toBe(VALID_TOKEN_1);
    expect(res.body.data.platform).toBe('IOS');

    const stored = await prisma.pushToken.findUnique({ where: { token: VALID_TOKEN_1 } });
    expect(stored).not.toBeNull();
    expect(stored!.userId).toBe(memberUserId);
  });

  it('rejects invalid token', async () => {
    const res = await request(app)
      .post('/api/v1/push')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ token: 'not-a-valid-token', platform: 'IOS' });

    expect(res.status).toBe(400);
  });
});

// AC-02: DELETE /push-tokens/:token deactivates token
describe('DELETE /api/v1/push/:token', () => {
  it('deactivates token (AC-02)', async () => {
    await prisma.pushToken.create({
      data: { userId: memberUserId, token: VALID_TOKEN_1, platform: 'IOS' },
    });

    const res = await request(app)
      .delete(`/api/v1/push/${encodeURIComponent(VALID_TOKEN_1)}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);

    const stored = await prisma.pushToken.findUnique({ where: { token: VALID_TOKEN_1 } });
    expect(stored).toBeNull();
  });

  it('returns 404 for unknown token', async () => {
    const res = await request(app)
      .delete(`/api/v1/push/${encodeURIComponent('ExponentPushToken[unknown]')}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(404);
  });
});

// AC-03: sendToUser
describe('sendToUser', () => {
  beforeEach(async () => {
    await prisma.pushToken.create({
      data: { userId: memberUserId, token: VALID_TOKEN_1, platform: 'IOS' },
    });
  });

  afterEach(async () => {
    await prisma.pushToken.deleteMany({ where: { user: { clubId } } });
  });

  it('sends push to all active tokens of a user (AC-03)', async () => {
    const tickets = await pushService.sendToUser(memberUserId, {
      title: 'Test',
      body: 'Hello',
    });

    expect(tickets.length).toBe(1);
    expect(tickets[0].status).toBe('ok');
  });
});

// AC-04: sendToUsers
describe('sendToUsers', () => {
  beforeEach(async () => {
    await prisma.pushToken.createMany({
      data: [
        { userId: memberUserId, token: VALID_TOKEN_1, platform: 'IOS' },
        { userId: member2UserId, token: VALID_TOKEN_2, platform: 'ANDROID' },
      ],
    });
  });

  afterEach(async () => {
    await prisma.pushToken.deleteMany({ where: { user: { clubId } } });
  });

  it('sends push to multiple users (AC-04)', async () => {
    const tickets = await pushService.sendToUsers([memberUserId, member2UserId], {
      title: 'Broadcast',
      body: 'Hello everyone',
    });

    expect(tickets.length).toBe(2);
  });
});

// AC-05: sendToChannel (excl. author + muted)
describe('sendToChannel', () => {
  beforeEach(async () => {
    await prisma.pushToken.createMany({
      data: [
        { userId: memberUserId, token: VALID_TOKEN_1, platform: 'IOS' },
        { userId: member2UserId, token: VALID_TOKEN_2, platform: 'ANDROID' },
      ],
    });
  });

  afterEach(async () => {
    await prisma.pushToken.deleteMany({ where: { user: { clubId } } });
    await prisma.channelMute.deleteMany({ where: { channel: { clubId } } });
  });

  it('sends to channel members excluding author (AC-05)', async () => {
    const tickets = await pushService.sendToChannel(
      channelId,
      { title: 'New msg', body: 'Hello' },
      memberUserId, // exclude author
    );

    // Only member2 should receive (member1 is excluded as author)
    expect(tickets.length).toBe(1);
  });

  it('excludes muted users from channel push (AC-05)', async () => {
    // Mute for member2
    await prisma.channelMute.create({
      data: { channelId, userId: member2UserId },
    });

    const tickets = await pushService.sendToChannel(
      channelId,
      { title: 'New msg', body: 'Hello' },
      memberUserId, // exclude author
    );

    // member2 is muted, member1 is author → no one receives
    expect(tickets.length).toBe(0);
  });
});

// AC-06: sendToTeam
describe('sendToTeam', () => {
  beforeEach(async () => {
    await prisma.pushToken.createMany({
      data: [
        { userId: memberUserId, token: VALID_TOKEN_1, platform: 'IOS' },
        { userId: member2UserId, token: VALID_TOKEN_2, platform: 'ANDROID' },
      ],
    });
  });

  afterEach(async () => {
    await prisma.pushToken.deleteMany({ where: { user: { clubId } } });
  });

  it('sends to team members (AC-06)', async () => {
    const tickets = await pushService.sendToTeam(
      teamId,
      { title: 'Team Update', body: 'Match tomorrow' },
    );

    expect(tickets.length).toBe(2);
  });

  it('excludes specified user from team push', async () => {
    const tickets = await pushService.sendToTeam(
      teamId,
      { title: 'Team Update', body: 'Match tomorrow' },
      memberUserId,
    );

    expect(tickets.length).toBe(1);
  });
});

// AC-07: Message integration
describe('Message Push Integration', () => {
  beforeEach(async () => {
    await prisma.pushToken.createMany({
      data: [
        { userId: memberUserId, token: VALID_TOKEN_1, platform: 'IOS' },
        { userId: member2UserId, token: VALID_TOKEN_2, platform: 'ANDROID' },
      ],
    });
  });

  afterEach(async () => {
    await prisma.pushToken.deleteMany({ where: { user: { clubId } } });
  });

  it('sends push when message is created via API (AC-07)', async () => {
    const spy = jest.spyOn(pushService, 'sendToChannel');

    await request(app)
      .post(`/api/v1/channels/${channelId}/messages`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ content: 'Push test message', channelId });

    // sendToChannel is called fire-and-forget
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(spy).toHaveBeenCalledWith(
      channelId,
      expect.objectContaining({ title: 'Push Member', body: 'Push test message' }),
      memberUserId,
    );

    spy.mockRestore();
  });
});

// AC-08: handlePushReceipts
describe('handlePushReceipts', () => {
  it('processes receipts and reports deactivated tokens (AC-08)', async () => {
    const result = await pushService.handlePushReceipts(['valid-receipt', 'invalid-receipt']);
    expect(result.deactivated).toBe(1);
  });

  it('handles empty ticket list', async () => {
    const result = await pushService.handlePushReceipts([]);
    expect(result.deactivated).toBe(0);
  });
});
