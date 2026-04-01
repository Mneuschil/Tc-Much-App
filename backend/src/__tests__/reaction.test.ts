import request from 'supertest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioClient } from 'socket.io-client';
import { prisma } from '../config/database';
import app from '../app';
import { hashPassword, generateAccessToken } from '../services/auth.service';
import { initializeSocket } from '../socket';
import type { UserRole } from '@tennis-club/shared';

const CLUB_CODE = 'REACTTST';
let clubId: string;
let memberToken: string;
let member2Token: string;
let memberUserId: string;
let member2UserId: string;
let channelId: string;
let messageId: string;

beforeAll(async () => {
  const passwordHash = await hashPassword('password123');

  const club = await prisma.club.create({ data: { name: 'Reaction Test Club', clubCode: CLUB_CODE } });
  clubId = club.id;

  const memberUser = await prisma.user.create({
    data: {
      email: 'reactmember@test.de', passwordHash, firstName: 'React', lastName: 'Member', clubId,
      roles: { create: [{ role: 'MEMBER', clubId }] },
    },
  });
  memberUserId = memberUser.id;

  const member2User = await prisma.user.create({
    data: {
      email: 'reactmember2@test.de', passwordHash, firstName: 'React2', lastName: 'Member', clubId,
      roles: { create: [{ role: 'MEMBER', clubId }] },
    },
  });
  member2UserId = member2User.id;

  memberToken = generateAccessToken({ userId: memberUser.id, clubId, roles: ['MEMBER'] as UserRole[] });
  member2Token = generateAccessToken({ userId: member2User.id, clubId, roles: ['MEMBER'] as UserRole[] });

  const channel = await prisma.channel.create({
    data: { name: 'Reaction Channel', visibility: 'PUBLIC', clubId, createdById: memberUserId },
  });
  channelId = channel.id;

  const msg = await prisma.message.create({
    data: { content: 'React to this', channelId, authorId: memberUserId },
  });
  messageId = msg.id;
});

afterAll(async () => {
  await prisma.messageReaction.deleteMany({ where: { message: { channel: { clubId } } } });
  await prisma.message.deleteMany({ where: { channel: { clubId } } });
  await prisma.channelMember.deleteMany({ where: { channel: { clubId } } });
  await prisma.channel.deleteMany({ where: { clubId } });
  await prisma.userRoleAssignment.deleteMany({ where: { clubId } });
  await prisma.refreshToken.deleteMany({ where: { user: { clubId } } });
  await prisma.user.deleteMany({ where: { clubId } });
  await prisma.club.deleteMany({ where: { clubCode: CLUB_CODE } });
  await prisma.$disconnect();
});

// AC-01: POST /messages/:id/reactions adds reaction
describe('POST /api/v1/channels/messages/:messageId/reactions', () => {
  afterEach(async () => {
    await prisma.messageReaction.deleteMany({ where: { messageId } });
  });

  it('adds reaction with valid type (AC-01)', async () => {
    const res = await request(app)
      .post(`/api/v1/channels/messages/${messageId}/reactions`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ messageId, type: 'THUMBS_UP' });

    expect(res.status).toBe(201);
    expect(res.body.data.reaction.type).toBe('THUMBS_UP');
    expect(res.body.data.reactions.THUMBS_UP).toBe(1);
    expect(res.body.data.reactions.userReactions).toContain('THUMBS_UP');
  });

  // AC-03: Unique constraint
  it('rejects duplicate reaction (same user + type) with 409 (AC-03)', async () => {
    // First reaction
    await request(app)
      .post(`/api/v1/channels/messages/${messageId}/reactions`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ messageId, type: 'HEART' });

    // Duplicate
    const res = await request(app)
      .post(`/api/v1/channels/messages/${messageId}/reactions`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ messageId, type: 'HEART' });

    expect(res.status).toBe(409);
  });

  // AC-06: Auth required
  it('rejects unauthenticated user (AC-06)', async () => {
    const res = await request(app)
      .post(`/api/v1/channels/messages/${messageId}/reactions`)
      .send({ messageId, type: 'THUMBS_UP' });

    expect(res.status).toBe(401);
  });
});

// AC-02: DELETE /messages/:id/reactions/:type removes reaction
describe('DELETE /api/v1/channels/messages/:messageId/reactions/:type', () => {
  it('removes existing reaction (AC-02)', async () => {
    // Add first
    await request(app)
      .post(`/api/v1/channels/messages/${messageId}/reactions`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ messageId, type: 'CELEBRATE' });

    // Remove
    const res = await request(app)
      .delete(`/api/v1/channels/messages/${messageId}/reactions/CELEBRATE`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.reactions.CELEBRATE).toBe(0);
  });

  it('returns 404 when removing non-existent reaction', async () => {
    const res = await request(app)
      .delete(`/api/v1/channels/messages/${messageId}/reactions/THINKING`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(404);
  });
});

// AC-04: Aggregated reactions in message response
describe('Aggregated Reactions in Messages', () => {
  beforeAll(async () => {
    // Add reactions from 2 users
    await prisma.messageReaction.createMany({
      data: [
        { messageId, userId: memberUserId, type: 'THUMBS_UP' },
        { messageId, userId: memberUserId, type: 'HEART' },
        { messageId, userId: member2UserId, type: 'THUMBS_UP' },
      ],
    });
  });

  afterAll(async () => {
    await prisma.messageReaction.deleteMany({ where: { messageId } });
  });

  it('returns aggregated reaction counts + userReactions in message list (AC-04)', async () => {
    const res = await request(app)
      .get(`/api/v1/channels/${channelId}/messages`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    const msg = res.body.data.messages.find((m: { id: string }) => m.id === messageId);
    expect(msg).toBeDefined();
    expect(msg.reactions.THUMBS_UP).toBe(2);
    expect(msg.reactions.HEART).toBe(1);
    expect(msg.reactions.CELEBRATE).toBe(0);
    expect(msg.reactions.THINKING).toBe(0);
    expect(msg.reactions.userReactions).toContain('THUMBS_UP');
    expect(msg.reactions.userReactions).toContain('HEART');
  });

  it('returns correct userReactions for different user', async () => {
    const res = await request(app)
      .get(`/api/v1/channels/${channelId}/messages`)
      .set('Authorization', `Bearer ${member2Token}`);

    const msg = res.body.data.messages.find((m: { id: string }) => m.id === messageId);
    expect(msg.reactions.userReactions).toContain('THUMBS_UP');
    expect(msg.reactions.userReactions).not.toContain('HEART');
  });
});

// AC-05: Socket.io message:reaction event
describe('Socket.io Reaction Events', () => {
  let httpServer: ReturnType<typeof createServer>;
  let io: Server;
  let port: number;

  beforeAll((done) => {
    httpServer = createServer(app);
    io = initializeSocket(httpServer);
    app.set('io', io);
    httpServer.listen(0, () => {
      const addr = httpServer.address();
      port = typeof addr === 'object' && addr ? addr.port : 0;
      done();
    });
  });

  afterAll((done) => {
    io.close();
    httpServer.close(done);
  });

  it('emits message:reaction event on add (AC-05)', (done) => {
    const client = ioClient(`http://localhost:${port}`, {
      auth: { token: memberToken },
      transports: ['websocket'],
    });

    client.on('connect', () => {
      client.on('message:reaction', (data: { messageId: string; action: string; type: string }) => {
        expect(data.messageId).toBe(messageId);
        expect(data.action).toBe('added');
        expect(data.type).toBe('THINKING');
        client.disconnect();

        // Cleanup
        prisma.messageReaction.deleteMany({ where: { messageId, type: 'THINKING' } }).then(() => done());
      });

      setTimeout(async () => {
        await request(app)
          .post(`/api/v1/channels/messages/${messageId}/reactions`)
          .set('Authorization', `Bearer ${member2Token}`)
          .send({ messageId, type: 'THINKING' });
      }, 200);
    });
  });
});
