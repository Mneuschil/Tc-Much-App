import request from 'supertest';
import { prisma } from '../config/database';
import app from '../app';
import { hashPassword, generateAccessToken } from '../services/auth.service';
import type { UserRole } from '@tennis-club/shared';

const CLUB_CODE = 'TEAMTEST';
let clubId: string;
let otherClubId: string;
let adminToken: string;
let boardToken: string;
let memberToken: string;
let otherClubToken: string;
let adminUserId: string;
let memberUserId: string;
let member2UserId: string;

beforeAll(async () => {
  const passwordHash = await hashPassword('password123');

  const club = await prisma.club.create({ data: { name: 'Team Test Club', clubCode: CLUB_CODE } });
  clubId = club.id;

  const otherClub = await prisma.club.create({
    data: { name: 'Other Team Club', clubCode: 'TEAMOTH1' },
  });
  otherClubId = otherClub.id;

  const adminUser = await prisma.user.create({
    data: {
      email: 'teamadmin@test.de',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Team',
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
      email: 'teamboard@test.de',
      passwordHash,
      firstName: 'Board',
      lastName: 'Team',
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
      email: 'teammember@test.de',
      passwordHash,
      firstName: 'Member',
      lastName: 'Team',
      clubId,
      roles: { create: [{ role: 'MEMBER', clubId }] },
    },
  });
  memberUserId = memberUser.id;

  const member2User = await prisma.user.create({
    data: {
      email: 'teammember2@test.de',
      passwordHash,
      firstName: 'Member2',
      lastName: 'Team',
      clubId,
      roles: { create: [{ role: 'MEMBER', clubId }] },
    },
  });
  member2UserId = member2User.id;

  const otherUser = await prisma.user.create({
    data: {
      email: 'teamother@test.de',
      passwordHash,
      firstName: 'Other',
      lastName: 'Team',
      clubId: otherClubId,
      roles: { create: [{ role: 'MEMBER', clubId: otherClubId }] },
    },
  });

  // Create a team in other club for multi-tenant test
  await prisma.team.create({
    data: { name: 'Other Club Team', type: 'MATCH_TEAM', clubId: otherClubId },
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
});

afterAll(async () => {
  await prisma.channelMember.deleteMany({
    where: { channel: { clubId: { in: [clubId, otherClubId] } } },
  });
  await prisma.channel.deleteMany({ where: { clubId: { in: [clubId, otherClubId] } } });
  await prisma.teamMember.deleteMany({
    where: { team: { clubId: { in: [clubId, otherClubId] } } },
  });
  await prisma.team.deleteMany({ where: { clubId: { in: [clubId, otherClubId] } } });
  await prisma.userRoleAssignment.deleteMany({ where: { clubId: { in: [clubId, otherClubId] } } });
  await prisma.refreshToken.deleteMany({
    where: { user: { clubId: { in: [clubId, otherClubId] } } },
  });
  await prisma.user.deleteMany({ where: { clubId: { in: [clubId, otherClubId] } } });
  await prisma.club.deleteMany({ where: { clubCode: { in: [CLUB_CODE, 'TEAMOTH1'] } } });
  await prisma.$disconnect();
});

// AC-01: POST /teams creates team with type
describe('POST /api/v1/teams', () => {
  it('creates team with type MATCH_TEAM (AC-01)', async () => {
    const res = await request(app)
      .post('/api/v1/teams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Herren 1', type: 'MATCH_TEAM', league: 'Bezirksliga', season: '2026' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Herren 1');

    // Cleanup for subsequent tests
    await prisma.channel.deleteMany({ where: { teamId: res.body.data.id } });
    await prisma.team.delete({ where: { id: res.body.data.id } });
  });

  // AC-02: Auto-Channel
  it('creates RESTRICTED auto-channel on team creation (AC-02)', async () => {
    const res = await request(app)
      .post('/api/v1/teams')
      .set('Authorization', `Bearer ${boardToken}`)
      .send({ name: 'Training A', type: 'TRAINING_GROUP' });

    expect(res.status).toBe(201);
    expect(res.body.data.channels).toBeDefined();
    expect(res.body.data.channels.length).toBe(1);
    expect(res.body.data.channels[0].name).toBe('Training A Chat');

    // Verify channel is RESTRICTED
    const channel = await prisma.channel.findFirst({ where: { teamId: res.body.data.id } });
    expect(channel!.visibility).toBe('RESTRICTED');

    // Cleanup
    await prisma.channel.deleteMany({ where: { teamId: res.body.data.id } });
    await prisma.team.delete({ where: { id: res.body.data.id } });
  });

  // AC-10: MEMBER cannot create team
  it('rejects MEMBER from creating team (AC-10)', async () => {
    const res = await request(app)
      .post('/api/v1/teams')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Fail Team', type: 'MATCH_TEAM' });

    expect(res.status).toBe(403);
  });
});

// AC-03: GET /teams with type filter
describe('GET /api/v1/teams', () => {
  let matchTeamId: string;
  let trainingGroupId: string;

  beforeAll(async () => {
    const mt = await prisma.team.create({
      data: { name: 'Herren Test', type: 'MATCH_TEAM', clubId },
    });
    matchTeamId = mt.id;
    const tg = await prisma.team.create({
      data: { name: 'Training Test', type: 'TRAINING_GROUP', clubId },
    });
    trainingGroupId = tg.id;
  });

  afterAll(async () => {
    await prisma.team.deleteMany({ where: { id: { in: [matchTeamId, trainingGroupId] } } });
  });

  it('lists all club teams (AC-03)', async () => {
    const res = await request(app)
      .get('/api/v1/teams')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('filters by type (AC-03)', async () => {
    const res = await request(app)
      .get('/api/v1/teams?type=MATCH_TEAM')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    for (const team of res.body.data) {
      expect(team.type).toBe('MATCH_TEAM');
    }
  });
});

// AC-04: GET /teams/:id
describe('GET /api/v1/teams/:teamId', () => {
  let teamId: string;

  beforeAll(async () => {
    const team = await prisma.team.create({
      data: { name: 'Detail Team', type: 'MATCH_TEAM', clubId },
    });
    teamId = team.id;
    await prisma.teamMember.create({ data: { teamId, userId: memberUserId, position: 1 } });
  });

  afterAll(async () => {
    await prisma.teamMember.deleteMany({ where: { teamId } });
    await prisma.team.delete({ where: { id: teamId } });
  });

  it('returns team detail with members (AC-04)', async () => {
    const res = await request(app)
      .get(`/api/v1/teams/${teamId}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Detail Team');
    expect(res.body.data.members.length).toBe(1);
    expect(res.body.data.members[0].user.firstName).toBe('Member');
  });
});

// AC-05: PUT /teams/:id
describe('PUT /api/v1/teams/:teamId', () => {
  let teamId: string;

  beforeAll(async () => {
    const team = await prisma.team.create({
      data: { name: 'Update Team', type: 'MATCH_TEAM', clubId },
    });
    teamId = team.id;
  });

  afterAll(async () => {
    await prisma.team.delete({ where: { id: teamId } }).catch(() => {});
  });

  it('updates team data as BOARD_MEMBER (AC-05)', async () => {
    const res = await request(app)
      .put(`/api/v1/teams/${teamId}`)
      .set('Authorization', `Bearer ${boardToken}`)
      .send({ name: 'Updated Team', league: 'Kreisliga' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Team');
    expect(res.body.data.league).toBe('Kreisliga');
  });

  it('rejects MEMBER from updating (AC-10)', async () => {
    const res = await request(app)
      .put(`/api/v1/teams/${teamId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Hacked' });

    expect(res.status).toBe(403);
  });
});

// AC-06: DELETE /teams/:id
describe('DELETE /api/v1/teams/:teamId', () => {
  it('deletes team + auto-channel as ADMIN (AC-06)', async () => {
    // Create team with auto-channel
    const createRes = await request(app)
      .post('/api/v1/teams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Delete Me', type: 'BOARD_GROUP' });

    const teamId = createRes.body.data.id;
    const channelBefore = await prisma.channel.findFirst({ where: { teamId } });
    expect(channelBefore).not.toBeNull();

    const res = await request(app)
      .delete(`/api/v1/teams/${teamId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const teamAfter = await prisma.team.findUnique({ where: { id: teamId } });
    expect(teamAfter).toBeNull();

    const channelAfter = await prisma.channel.findFirst({ where: { teamId } });
    expect(channelAfter).toBeNull();
  });

  it('rejects BOARD_MEMBER from deleting (AC-10)', async () => {
    const team = await prisma.team.create({
      data: { name: 'No Delete', type: 'MATCH_TEAM', clubId },
    });

    const res = await request(app)
      .delete(`/api/v1/teams/${team.id}`)
      .set('Authorization', `Bearer ${boardToken}`);

    expect(res.status).toBe(403);

    // Cleanup
    await prisma.team.delete({ where: { id: team.id } });
  });
});

// AC-07 & AC-08: Member management with ChannelMember sync
describe('Team Members', () => {
  let teamId: string;
  let channelId: string;

  beforeAll(async () => {
    const createRes = await request(app)
      .post('/api/v1/teams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Members Team', type: 'MATCH_TEAM' });

    teamId = createRes.body.data.id;
    channelId = createRes.body.data.channels[0].id;
  });

  afterAll(async () => {
    await prisma.channelMember.deleteMany({ where: { channelId } });
    await prisma.teamMember.deleteMany({ where: { teamId } });
    await prisma.channel.deleteMany({ where: { teamId } });
    await prisma.team.delete({ where: { id: teamId } }).catch(() => {});
  });

  it('adds member with ChannelMember sync (AC-07)', async () => {
    const res = await request(app)
      .post(`/api/v1/teams/${teamId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: memberUserId, position: 1 });

    expect(res.status).toBe(201);
    expect(res.body.data.user.firstName).toBe('Member');

    // Verify ChannelMember was created
    const cm = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId: memberUserId } },
    });
    expect(cm).not.toBeNull();
  });

  it('removes member with ChannelMember sync (AC-08)', async () => {
    // Add member2 first
    await request(app)
      .post(`/api/v1/teams/${teamId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: member2UserId });

    const res = await request(app)
      .delete(`/api/v1/teams/${teamId}/members/${member2UserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    // Verify ChannelMember was removed
    const cm = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId: member2UserId } },
    });
    expect(cm).toBeNull();
  });

  // AC-09: Update position
  it('updates member position (AC-09)', async () => {
    const res = await request(app)
      .put(`/api/v1/teams/${teamId}/members/${memberUserId}/position`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ position: 3 });

    expect(res.status).toBe(200);
    expect(res.body.data.position).toBe(3);
  });
});

// AC-12 to AC-15: Ensure team channel
describe('POST /api/v1/teams/:teamId/ensure-channel', () => {
  let teamWithoutChannelId: string;
  let teamWithChannelId: string;
  let existingChannelId: string;

  beforeAll(async () => {
    // Team WITHOUT channel (simulate legacy)
    const t1 = await prisma.team.create({
      data: { name: 'Legacy Team', type: 'BOARD_GROUP', clubId },
    });
    teamWithoutChannelId = t1.id;
    await prisma.teamMember.create({ data: { teamId: t1.id, userId: memberUserId } });

    // Team WITH channel
    const t2 = await prisma.team.create({
      data: { name: 'Channel Team', type: 'MATCH_TEAM', clubId },
    });
    teamWithChannelId = t2.id;
    const ch = await prisma.channel.create({
      data: {
        name: 'Channel Team Chat',
        visibility: 'RESTRICTED',
        teamId: t2.id,
        clubId,
        createdById: adminUserId,
      },
    });
    existingChannelId = ch.id;
  });

  afterAll(async () => {
    await prisma.channelMember.deleteMany({
      where: { channel: { teamId: { in: [teamWithoutChannelId, teamWithChannelId] } } },
    });
    await prisma.channel.deleteMany({
      where: { teamId: { in: [teamWithoutChannelId, teamWithChannelId] } },
    });
    await prisma.teamMember.deleteMany({
      where: { teamId: { in: [teamWithoutChannelId, teamWithChannelId] } },
    });
    await prisma.team.deleteMany({
      where: { id: { in: [teamWithoutChannelId, teamWithChannelId] } },
    });
  });

  it('creates channel for team without one (AC-12)', async () => {
    const res = await request(app)
      .post(`/api/v1/teams/${teamWithoutChannelId}/ensure-channel`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.name).toBe('Legacy Team Chat');

    // Verify ChannelMember was synced for existing team member
    const cm = await prisma.channelMember.findFirst({
      where: { channelId: res.body.data.id, userId: memberUserId },
    });
    expect(cm).not.toBeNull();
  });

  it('returns existing channel if already present (AC-13)', async () => {
    const res = await request(app)
      .post(`/api/v1/teams/${teamWithChannelId}/ensure-channel`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(existingChannelId);
  });

  it('returns 404 for non-existent team (AC-14)', async () => {
    const res = await request(app)
      .post('/api/v1/teams/00000000-0000-0000-0000-000000000000/ensure-channel')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('does not allow ensure-channel for other club team (AC-15)', async () => {
    const otherTeam = await prisma.team.findFirst({ where: { clubId: otherClubId } });
    const res = await request(app)
      .post(`/api/v1/teams/${otherTeam!.id}/ensure-channel`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(404);
  });
});

// AC-11: Multi-Tenant
describe('Multi-Tenant', () => {
  it('does not show other club teams (AC-11)', async () => {
    const res = await request(app)
      .get('/api/v1/teams')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    for (const team of res.body.data) {
      expect(team.clubId).toBe(clubId);
    }

    const names = res.body.data.map((t: { name: string }) => t.name);
    expect(names).not.toContain('Other Club Team');
  });
});
