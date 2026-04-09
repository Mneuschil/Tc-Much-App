import { prisma } from '../config/database';
import type {
  CreateChannelInput,
  CreateMessageInput,
  UpdateChannelInput,
} from '@tennis-club/shared';
import { logAudit } from '../utils/audit';

export async function getChannelsForClub(clubId: string, userId: string) {
  // Check if user is admin/board (should see all channels)
  const userRoles = await prisma.userRoleAssignment.findMany({
    where: { userId },
    select: { role: true },
  });
  const isPrivileged = userRoles.some((r) =>
    ['CLUB_ADMIN', 'SYSTEM_ADMIN', 'BOARD_MEMBER'].includes(r.role),
  );

  const channels = await prisma.channel.findMany({
    where: {
      clubId,
      parentChannelId: null,
      isArchived: false,
      ...(isPrivileged
        ? {}
        : {
            OR: [{ visibility: 'PUBLIC' }, { members: { some: { userId } } }],
          }),
    },
    include: {
      subchannels: true,
      team: { select: { id: true, name: true } },
      _count: { select: { messages: true, members: true } },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return channels.map(({ messages, ...channel }) => ({
    ...channel,
    lastMessage: messages[0] ?? null,
  }));
}

export async function getChannelById(channelId: string, clubId: string) {
  return prisma.channel.findFirst({
    where: { id: channelId, clubId },
    include: {
      subchannels: true,
      team: { select: { id: true, name: true } },
      members: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      },
    },
  });
}

export async function getChannelByIdOrFail(channelId: string, clubId: string) {
  const channel = await getChannelById(channelId, clubId);
  if (!channel) {
    throw Object.assign(new Error('Channel nicht gefunden'), { statusCode: 404 });
  }
  return channel;
}

export async function createChannel(
  input: CreateChannelInput,
  clubId: string,
  createdById: string,
) {
  if (input.parentChannelId) {
    const parent = await prisma.channel.findUnique({ where: { id: input.parentChannelId } });
    if (parent?.parentChannelId) {
      throw new Error('Subchannels koennen nicht verschachtelt werden (max 1 Ebene)');
    }
  }

  return prisma.channel.create({
    data: {
      name: input.name,
      description: input.description,
      visibility: input.visibility as 'PUBLIC' | 'RESTRICTED',
      parentChannelId: input.parentChannelId,
      teamId: input.teamId,
      clubId,
      createdById,
    },
  });
}

export async function seedDefaultChannels(clubId: string, createdById: string) {
  const defaults = [
    { name: 'Allgemein', visibility: 'PUBLIC' as const },
    { name: 'Turniere', visibility: 'PUBLIC' as const },
    { name: 'Jugend', visibility: 'RESTRICTED' as const },
    { name: 'Training', visibility: 'RESTRICTED' as const },
    { name: 'Mannschaft', visibility: 'RESTRICTED' as const },
    { name: 'Vorstand', visibility: 'RESTRICTED' as const },
  ];

  for (const ch of defaults) {
    await prisma.channel.create({
      data: {
        name: ch.name,
        visibility: ch.visibility,
        isDefault: true,
        clubId,
        createdById,
      },
    });
  }
}

export async function updateChannel(channelId: string, clubId: string, data: UpdateChannelInput) {
  const channel = await prisma.channel.findFirst({ where: { id: channelId, clubId } });
  if (!channel) {
    throw Object.assign(new Error('Channel nicht gefunden'), { statusCode: 404 });
  }

  return prisma.channel.update({
    where: { id: channelId },
    data,
  });
}

export async function deleteChannel(channelId: string, clubId: string, userId: string) {
  const channel = await prisma.channel.findFirst({ where: { id: channelId, clubId } });
  if (!channel) {
    throw Object.assign(new Error('Channel nicht gefunden'), { statusCode: 404 });
  }
  if (channel.isDefault) {
    throw Object.assign(new Error('Default-Channels koennen nicht geloescht werden'), {
      statusCode: 400,
      code: 'CANNOT_DELETE_DEFAULT',
    });
  }

  // Archive subchannels first, then archive channel (Soft Delete)
  await prisma.channel.updateMany({
    where: { parentChannelId: channelId },
    data: { isArchived: true },
  });
  const archived = await prisma.channel.update({
    where: { id: channelId },
    data: { isArchived: true },
  });
  logAudit('CHANNEL_ARCHIVED', userId, clubId, { channelId });
  return archived;
}

export async function toggleMute(channelId: string, userId: string, clubId: string) {
  // Verify channel belongs to club
  const channel = await prisma.channel.findFirst({ where: { id: channelId, clubId } });
  if (!channel) {
    throw Object.assign(new Error('Channel nicht gefunden'), { statusCode: 404 });
  }

  const existing = await prisma.channelMute.findUnique({
    where: { channelId_userId: { channelId, userId } },
  });

  if (existing) {
    await prisma.channelMute.delete({ where: { id: existing.id } });
    return { muted: false };
  }

  await prisma.channelMute.create({ data: { channelId, userId } });
  return { muted: true };
}

export async function getMessages(channelId: string, page: number, limit: number) {
  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { channelId },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        replyTo: { select: { id: true, content: true, authorId: true } },
        reactions: true,
        _count: { select: { reactions: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.message.count({ where: { channelId } }),
  ]);

  return { messages, total };
}

export async function createMessage(input: CreateMessageInput, authorId: string) {
  return prisma.message.create({
    data: {
      content: input.content,
      mediaUrls: input.mediaUrls ?? [],
      channelId: input.channelId,
      authorId,
      replyToId: input.replyToId,
    },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      replyTo: { select: { id: true, content: true, authorId: true } },
    },
  });
}

export async function deleteMessage(messageId: string, userId: string) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message || message.authorId !== userId) {
    throw new Error('Nachricht nicht gefunden oder keine Berechtigung');
  }
  return prisma.message.delete({ where: { id: messageId } });
}

export async function addReaction(
  messageId: string,
  userId: string,
  type: 'THUMBS_UP' | 'HEART' | 'CELEBRATE' | 'THINKING',
) {
  return prisma.messageReaction.create({
    data: { messageId, userId, type },
  });
}

export async function removeReaction(
  messageId: string,
  userId: string,
  type: 'THUMBS_UP' | 'HEART' | 'CELEBRATE' | 'THINKING',
) {
  return prisma.messageReaction.deleteMany({
    where: { messageId, userId, type },
  });
}

export async function searchMessages(clubId: string, query: string, channelId?: string) {
  return prisma.message.findMany({
    where: {
      channel: { clubId },
      ...(channelId ? { channelId } : {}),
      content: { contains: query, mode: 'insensitive' },
    },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      channel: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}
