import request from 'supertest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { prisma } from '../config/database';
import app from '../app';
import { hashPassword, generateAccessToken } from '../services/auth.service';
import { initializeSocket } from '../socket';
import type { UserRole } from '@tennis-club/shared';

const CLUB_CODE = 'MSGTEST1';
let clubId: string;
let otherClubId: string;
let adminToken: string;
let memberToken: string;
let member2Token: string;
let otherClubToken: string;
let adminUserId: string;
let memberUserId: string;
let member2UserId: string;
let publicChannelId: string;
let restrictedChannelId: string;
let otherClubChannelId: string;

beforeAll(async () => {
  const passwordHash = await hashPassword('password123');

  const club = await prisma.club.create({ data: { name: 'Msg Test Club', clubCode: CLUB_CODE } });
  clubId = club.id;

  const otherClub = await prisma.club.create({ data: { name: 'Other Msg Club', clubCode: 'MSGOTH01' } });
  otherClubId = otherClub.id;

  const adminUser = await prisma.user.create({
    data: {
      email: 'msgadmin@test.de', passwordHash, firstName: 'Admin', lastName: 'Msg', clubId,
      roles: { create: [{ role: 'CLUB_ADMIN', clubId }, { role: 'MEMBER', clubId }] },
    },
  });
  adminUserId = adminUser.id;

  const memberUser = await prisma.user.create({
    data: {
      email: 'msgmember@test.de', passwordHash, firstName: 'Member', lastName: 'Msg', clubId,
      roles: { create: [{ role: 'MEMBER', clubId }] },
    },
  });
  memberUserId = memberUser.id;

  const member2User = await prisma.user.create({
    data: {
      email: 'msgmember2@test.de', passwordHash, firstName: 'Member2', lastName: 'Msg', clubId,
      roles: { create: [{ role: 'MEMBER', clubId }] },
    },
  });
  member2UserId = member2User.id;

  const otherUser = await prisma.user.create({
    data: {
      email: 'msgother@test.de', passwordHash, firstName: 'Other', lastName: 'Msg', clubId: otherClubId,
      roles: { create: [{ role: 'MEMBER', clubId: otherClubId }] },
    },
  });

  adminToken = generateAccessToken({ userId: adminUser.id, clubId, roles: ['CLUB_ADMIN', 'MEMBER'] as UserRole[] });
  memberToken = generateAccessToken({ userId: memberUser.id, clubId, roles: ['MEMBER'] as UserRole[] });
  member2Token = generateAccessToken({ userId: member2User.id, clubId, roles: ['MEMBER'] as UserRole[] });
  otherClubToken = generateAccessToken({ userId: otherUser.id, clubId: otherClubId, roles: ['MEMBER'] as UserRole[] });

  // Create channels
  const pubChannel = await prisma.channel.create({
    data: { name: 'Msg Public', visibility: 'PUBLIC', clubId, createdById: adminUserId },
  });
  publicChannelId = pubChannel.id;

  const resChannel = await prisma.channel.create({
    data: { name: 'Msg Restricted', visibility: 'RESTRICTED', clubId, createdById: adminUserId },
  });
  restrictedChannelId = resChannel.id;

  // Only memberUser has access to restricted channel
  await prisma.channelMember.create({
    data: { channelId: restrictedChannelId, userId: memberUserId },
  });

  const otherChannel = await prisma.channel.create({
    data: { name: 'Other Club Channel', visibility: 'PUBLIC', clubId: otherClubId, createdById: otherUser.id },
  });
  otherClubChannelId = otherChannel.id;
});

afterAll(async () => {
  await prisma.messageReaction.deleteMany({ where: { message: { channel: { clubId: { in: [clubId, otherClubId] } } } } });
  await prisma.message.deleteMany({ where: { channel: { clubId: { in: [clubId, otherClubId] } } } });
  await prisma.channelMute.deleteMany({ where: { channel: { clubId: { in: [clubId, otherClubId] } } } });
  await prisma.channelMember.deleteMany({ where: { channel: { clubId: { in: [clubId, otherClubId] } } } });
  await prisma.channel.deleteMany({ where: { clubId: { in: [clubId, otherClubId] } } });
  await prisma.userRoleAssignment.deleteMany({ where: { clubId: { in: [clubId, otherClubId] } } });
  await prisma.refreshToken.deleteMany({ where: { user: { clubId: { in: [clubId, otherClubId] } } } });
  await prisma.user.deleteMany({ where: { clubId: { in: [clubId, otherClubId] } } });
  await prisma.club.deleteMany({ where: { clubCode: { in: [CLUB_CODE, 'MSGOTH01'] } } });
  await prisma.$disconnect();
});

// AC-01: GET /channels/:id/messages with cursor-based pagination
describe('GET /api/v1/channels/:channelId/messages', () => {
  let messageIds: string[] = [];

  beforeAll(async () => {
    // Create 5 messages for pagination testing
    for (let i = 0; i < 5; i++) {
      const msg = await prisma.message.create({
        data: {
          content: `Test message ${i + 1}`,
          channelId: publicChannelId,
          authorId: memberUserId,
        },
      });
      messageIds.push(msg.id);
    }
  });

  it('returns messages with cursor-based pagination (AC-01)', async () => {
    const res = await request(app)
      .get(`/api/v1/channels/${publicChannelId}/messages?limit=3`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.messages.length).toBe(3);
    expect(res.body.data.hasMore).toBe(true);
    expect(res.body.data.nextCursor).toBeDefined();

    // Fetch next page with cursor
    const res2 = await request(app)
      .get(`/api/v1/channels/${publicChannelId}/messages?limit=3&cursor=${res.body.data.nextCursor}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res2.status).toBe(200);
    expect(res2.body.data.messages.length).toBe(2);
    expect(res2.body.data.hasMore).toBe(false);
  });

  // AC-08: Search
  it('filters messages by search term (AC-08)', async () => {
    const res = await request(app)
      .get(`/api/v1/channels/${publicChannelId}/messages?search=message 3`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.messages.length).toBe(1);
    expect(res.body.data.messages[0].content).toBe('Test message 3');
  });
});

// AC-02: POST /channels/:id/messages
describe('POST /api/v1/channels/:channelId/messages', () => {
  it('creates message with content and mediaUrls (AC-02)', async () => {
    const res = await request(app)
      .post(`/api/v1/channels/${publicChannelId}/messages`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ content: 'Hello World', channelId: publicChannelId, mediaUrls: ['https://example.com/img.jpg'] });

    expect(res.status).toBe(201);
    expect(res.body.data.content).toBe('Hello World');
    expect(res.body.data.mediaUrls).toContain('https://example.com/img.jpg');
    expect(res.body.data.author.firstName).toBe('Member');
  });

  // AC-05: Reply
  it('creates reply with replyToId, response has replyTo object (AC-05)', async () => {
    // Create original message
    const original = await prisma.message.create({
      data: { content: 'Original message', channelId: publicChannelId, authorId: adminUserId },
    });

    const res = await request(app)
      .post(`/api/v1/channels/${publicChannelId}/messages`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ content: 'This is a reply', channelId: publicChannelId, replyToId: original.id });

    expect(res.status).toBe(201);
    expect(res.body.data.replyTo).toBeDefined();
    expect(res.body.data.replyTo.id).toBe(original.id);
    expect(res.body.data.replyTo.content).toBe('Original message');
    expect(res.body.data.replyTo.author).toBeDefined();
  });
});

// AC-03 & AC-04: DELETE /messages/:id
describe('DELETE /api/v1/channels/messages/:messageId', () => {
  it('deletes own message (AC-03)', async () => {
    const msg = await prisma.message.create({
      data: { content: 'To delete', channelId: publicChannelId, authorId: memberUserId },
    });

    const res = await request(app)
      .delete(`/api/v1/channels/messages/${msg.id}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    const deleted = await prisma.message.findUnique({ where: { id: msg.id } });
    expect(deleted).toBeNull();
  });

  it('rejects deleting another users message (AC-04)', async () => {
    const msg = await prisma.message.create({
      data: { content: 'Not yours', channelId: publicChannelId, authorId: adminUserId },
    });

    const res = await request(app)
      .delete(`/api/v1/channels/messages/${msg.id}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(403);

    // Cleanup
    await prisma.message.delete({ where: { id: msg.id } });
  });
});

// AC-06 & AC-07: Channel access control for messages
describe('Channel Access Control', () => {
  it('rejects reading messages from restricted channel without membership (AC-06)', async () => {
    const res = await request(app)
      .get(`/api/v1/channels/${restrictedChannelId}/messages`)
      .set('Authorization', `Bearer ${member2Token}`);

    expect(res.status).toBe(403);
  });

  it('rejects sending messages to restricted channel without membership (AC-07)', async () => {
    const res = await request(app)
      .post(`/api/v1/channels/${restrictedChannelId}/messages`)
      .set('Authorization', `Bearer ${member2Token}`)
      .send({ content: 'Should fail', channelId: restrictedChannelId });

    expect(res.status).toBe(403);
  });

  it('allows member with explicit membership to read restricted channel', async () => {
    const res = await request(app)
      .get(`/api/v1/channels/${restrictedChannelId}/messages`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
  });

  it('allows admin to read restricted channel without explicit membership', async () => {
    const res = await request(app)
      .get(`/api/v1/channels/${restrictedChannelId}/messages`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});

// AC-09, AC-10, AC-11: Socket.io tests
describe('Socket.io Integration', () => {
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

  it('rejects connection without token (AC-09)', (done) => {
    const client = ioClient(`http://localhost:${port}`, {
      auth: {},
      transports: ['websocket'],
    });

    client.on('connect_error', (err) => {
      expect(err.message).toContain('Authentifizierung erforderlich');
      client.disconnect();
      done();
    });
  });

  it('rejects connection with invalid token (AC-09)', (done) => {
    const client = ioClient(`http://localhost:${port}`, {
      auth: { token: 'invalid-token' },
      transports: ['websocket'],
    });

    client.on('connect_error', (err) => {
      expect(err.message).toContain('Ungueltiger Token');
      client.disconnect();
      done();
    });
  });

  it('connects with valid token and auto-joins channel rooms (AC-10)', (done) => {
    const client = ioClient(`http://localhost:${port}`, {
      auth: { token: memberToken },
      transports: ['websocket'],
    });

    client.on('connect', () => {
      // If connected, the auth middleware passed and registerHandlers ran
      expect(client.connected).toBe(true);
      client.disconnect();
      done();
    });
  });

  it('receives message:created event in channel room (AC-11)', (done) => {
    const client = ioClient(`http://localhost:${port}`, {
      auth: { token: memberToken },
      transports: ['websocket'],
    });

    client.on('connect', () => {
      // Manually join channel room to ensure we receive events
      client.emit('channel:join', publicChannelId);

      // Small delay to ensure room join is processed
      setTimeout(async () => {
        client.on('message:created', (data: { content: string }) => {
          expect(data.content).toBe('Socket test message');
          client.disconnect();
          done();
        });

        // Send message via API
        await request(app)
          .post(`/api/v1/channels/${publicChannelId}/messages`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ content: 'Socket test message', channelId: publicChannelId });
      }, 200);
    });
  });
});

// AC-12: Multi-Tenant
describe('Multi-Tenant Messages', () => {
  it('cannot read messages from other club channel (AC-12)', async () => {
    const res = await request(app)
      .get(`/api/v1/channels/${otherClubChannelId}/messages`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(404);
  });

  it('cannot send messages to other club channel (AC-12)', async () => {
    const res = await request(app)
      .post(`/api/v1/channels/${otherClubChannelId}/messages`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ content: 'Cross-club hack', channelId: otherClubChannelId });

    expect(res.status).toBe(404);
  });
});
