import { prisma } from '../config/database';
import type { CreateTeamInput } from '@tennis-club/shared';

export async function getTeamsForClub(clubId: string, type?: string) {
  return prisma.team.findMany({
    where: {
      clubId,
      ...(type ? { type: type as 'MATCH_TEAM' | 'TRAINING_GROUP' | 'BOARD_GROUP' } : {}),
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      },
      _count: { select: { members: true } },
      channels: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getMyTeams(userId: string, clubId: string) {
  return prisma.team.findMany({
    where: {
      clubId,
      members: { some: { userId } },
    },
    include: {
      _count: { select: { members: true } },
      channels: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getTeamById(teamId: string, clubId: string) {
  return prisma.team.findFirst({
    where: { id: teamId, clubId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true, phone: true },
          },
        },
        orderBy: { position: 'asc' },
      },
      channels: { select: { id: true, name: true } },
    },
  });
}

export async function createTeam(input: CreateTeamInput, clubId: string, createdById: string) {
  const team = await prisma.team.create({
    data: {
      name: input.name,
      type: input.type as 'MATCH_TEAM' | 'TRAINING_GROUP' | 'BOARD_GROUP',
      league: input.league,
      season: input.season,
      clubId,
    },
  });

  // Auto-create a RESTRICTED channel for this team
  await prisma.channel.create({
    data: {
      name: `${team.name} Chat`,
      visibility: 'RESTRICTED',
      teamId: team.id,
      clubId,
      createdById,
    },
  });

  return prisma.team.findUnique({
    where: { id: team.id },
    include: {
      channels: { select: { id: true, name: true } },
      _count: { select: { members: true } },
    },
  });
}

export async function updateTeam(
  teamId: string,
  clubId: string,
  data: { name?: string; league?: string; season?: string },
) {
  const team = await prisma.team.findFirst({ where: { id: teamId, clubId } });
  if (!team) {
    throw Object.assign(new Error('Team nicht gefunden'), { statusCode: 404 });
  }

  return prisma.team.update({
    where: { id: teamId },
    data,
    include: {
      channels: { select: { id: true, name: true } },
      _count: { select: { members: true } },
    },
  });
}

export async function deleteTeam(teamId: string, clubId: string) {
  const team = await prisma.team.findFirst({ where: { id: teamId, clubId } });
  if (!team) {
    throw Object.assign(new Error('Team nicht gefunden'), { statusCode: 404 });
  }

  // Delete associated channel(s) first
  await prisma.channel.deleteMany({ where: { teamId } });
  return prisma.team.delete({ where: { id: teamId } });
}

export async function addTeamMember(
  teamId: string,
  userId: string,
  clubId: string,
  position?: number,
) {
  const team = await prisma.team.findFirst({ where: { id: teamId, clubId } });
  if (!team) {
    throw Object.assign(new Error('Team nicht gefunden'), { statusCode: 404 });
  }

  const member = await prisma.teamMember.create({
    data: { teamId, userId, position },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });

  // Sync: add user to team channel(s)
  const channels = await prisma.channel.findMany({ where: { teamId }, select: { id: true } });
  for (const ch of channels) {
    await prisma.channelMember.upsert({
      where: { channelId_userId: { channelId: ch.id, userId } },
      update: {},
      create: { channelId: ch.id, userId },
    });
  }

  return member;
}

export async function removeTeamMember(teamId: string, userId: string, clubId: string) {
  const team = await prisma.team.findFirst({ where: { id: teamId, clubId } });
  if (!team) {
    throw Object.assign(new Error('Team nicht gefunden'), { statusCode: 404 });
  }

  await prisma.teamMember.deleteMany({ where: { teamId, userId } });

  // Sync: remove user from team channel(s)
  const channels = await prisma.channel.findMany({ where: { teamId }, select: { id: true } });
  for (const ch of channels) {
    await prisma.channelMember.deleteMany({ where: { channelId: ch.id, userId } });
  }
}

export async function ensureTeamChannel(teamId: string, clubId: string, createdById: string) {
  const team = await prisma.team.findFirst({ where: { id: teamId, clubId } });
  if (!team) {
    throw Object.assign(new Error('Team nicht gefunden'), { statusCode: 404 });
  }

  const existing = await prisma.channel.findFirst({
    where: { teamId, clubId },
    select: { id: true, name: true },
  });
  if (existing) return existing;

  return prisma.$transaction(async (tx) => {
    const channel = await tx.channel.create({
      data: {
        name: `${team.name} Chat`,
        visibility: 'RESTRICTED',
        teamId,
        clubId,
        createdById,
      },
    });

    const members = await tx.teamMember.findMany({
      where: { teamId },
      select: { userId: true },
    });

    if (members.length > 0) {
      await tx.channelMember.createMany({
        data: members.map((m) => ({ channelId: channel.id, userId: m.userId })),
        skipDuplicates: true,
      });
    }

    return { id: channel.id, name: channel.name };
  });
}

export async function updateMemberPosition(
  teamId: string,
  userId: string,
  clubId: string,
  position: number,
) {
  const team = await prisma.team.findFirst({ where: { id: teamId, clubId } });
  if (!team) {
    throw Object.assign(new Error('Team nicht gefunden'), { statusCode: 404 });
  }

  const member = await prisma.teamMember.findFirst({ where: { teamId, userId } });
  if (!member) {
    throw Object.assign(new Error('Mitglied nicht im Team'), { statusCode: 404 });
  }

  return prisma.teamMember.update({
    where: { id: member.id },
    data: { position },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });
}
