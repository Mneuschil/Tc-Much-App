import { prisma } from '../config/database';
import type { CreateMessageInput } from '@tennis-club/shared';
import { SOCKET_ROOMS } from '@tennis-club/shared';
import type { Server } from 'socket.io';
import * as pushService from './push.service';
import { AppError } from '../utils/AppError';

const REACTION_TYPES = ['THUMBS_UP', 'HEART', 'CELEBRATE', 'THINKING'] as const;

const messageInclude = {
  author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
  replyTo: {
    select: {
      id: true,
      content: true,
      author: { select: { id: true, firstName: true, lastName: true } },
    },
  },
  reactions: { select: { type: true, userId: true } },
} as const;

function aggregateReactions<T extends { reactions: { type: string; userId: string }[] }>(
  message: T,
  currentUserId: string,
): Omit<T, 'reactions'> & { reactions: Record<string, number | string[]> } {
  const counts: Record<string, number> = {};
  for (const t of REACTION_TYPES) counts[t] = 0;
  const userReactions: string[] = [];

  for (const r of message.reactions) {
    counts[r.type]++;
    if (r.userId === currentUserId) userReactions.push(r.type);
  }

  const { reactions: _raw, ...rest } = message;
  return { ...rest, reactions: { ...counts, userReactions } };
}

export async function checkChannelAccess(channelId: string, userId: string, clubId: string) {
  const channel = await prisma.channel.findFirst({
    where: { id: channelId, clubId },
  });
  if (!channel) {
    throw AppError.notFound('Channel nicht gefunden');
  }

  if (channel.visibility === 'PUBLIC') {
    return channel;
  }

  // RESTRICTED: check if user is privileged or explicit member
  const userRoles = await prisma.userRoleAssignment.findMany({
    where: { userId },
    select: { role: true },
  });
  const isPrivileged = userRoles.some((r) =>
    ['CLUB_ADMIN', 'SYSTEM_ADMIN', 'BOARD_MEMBER'].includes(r.role),
  );
  if (isPrivileged) {
    return channel;
  }

  const membership = await prisma.channelMember.findUnique({
    where: { channelId_userId: { channelId, userId } },
  });
  if (!membership) {
    throw AppError.forbidden('Kein Zugriff auf diesen Channel', 'CHANNEL_ACCESS_DENIED');
  }

  return channel;
}

export async function getChannelMessages(
  channelId: string,
  currentUserId: string,
  opts: { cursor?: string; limit?: number; search?: string },
) {
  const limit = opts.limit || 20;

  const where: Record<string, unknown> = { channelId };
  if (opts.search) {
    where.content = { contains: opts.search, mode: 'insensitive' };
  }

  const findArgs: Record<string, unknown> = {
    where,
    include: messageInclude,
    orderBy: { createdAt: 'desc' },
    take: limit + 1, // fetch one extra to determine hasMore
  };

  if (opts.cursor) {
    findArgs.cursor = { id: opts.cursor };
    findArgs.skip = 1; // skip the cursor itself
  }

  const rawMessages = (await prisma.message.findMany(
    findArgs as Parameters<typeof prisma.message.findMany>[0],
  )) as Array<{
    id: string;
    content: string;
    mediaUrls: string[];
    channelId: string;
    authorId: string;
    replyToId: string | null;
    createdAt: Date;
    updatedAt: Date;
    author: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
    replyTo: {
      id: string;
      content: string;
      author: { id: string; firstName: string; lastName: string };
    } | null;
    reactions: { type: string; userId: string }[];
  }>;

  const hasMore = rawMessages.length > limit;
  if (hasMore) {
    rawMessages.pop();
  }

  const nextCursor =
    hasMore && rawMessages.length > 0 ? rawMessages[rawMessages.length - 1].id : null;

  return {
    messages: rawMessages.map((m) => aggregateReactions(m, currentUserId)),
    nextCursor,
    hasMore,
  };
}

export async function createMessage(
  channelId: string,
  input: Pick<CreateMessageInput, 'content' | 'mediaUrls' | 'replyToId'>,
  authorId: string,
) {
  const message = await prisma.message.create({
    data: {
      content: input.content,
      mediaUrls: input.mediaUrls ?? [],
      channelId,
      authorId,
      replyToId: input.replyToId,
    },
    include: messageInclude,
  });
  return aggregateReactions(message, authorId);
}

export async function deleteMessage(messageId: string, userId: string, isAdmin = false) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) {
    throw AppError.notFound('Nachricht nicht gefunden');
  }
  if (message.authorId !== userId && !isAdmin) {
    throw AppError.forbidden('Keine Berechtigung diese Nachricht zu löschen');
  }
  return prisma.message.delete({ where: { id: messageId } });
}

export async function searchMessages(clubId: string, query: string, channelId?: string) {
  if (!query) {
    throw AppError.badRequest('Suchbegriff erforderlich', 'VALIDATION_ERROR');
  }

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

export async function getMessagesWithAccessCheck(
  channelId: string,
  userId: string,
  clubId: string,
  opts: { cursor?: string; limit?: number; search?: string },
) {
  await checkChannelAccess(channelId, userId, clubId);
  return getChannelMessages(channelId, userId, opts);
}

export async function createMessageAndNotify(
  channelId: string,
  body: Pick<CreateMessageInput, 'content' | 'mediaUrls' | 'replyToId'>,
  userId: string,
  clubId: string,
  io: Server | null,
) {
  await checkChannelAccess(channelId, userId, clubId);
  const message = await createMessage(channelId, body, userId);

  if (io) {
    io.to(SOCKET_ROOMS.channel(channelId)).emit('message:created', message);
  }

  const authorName = `${message.author.firstName} ${message.author.lastName}`;
  pushService
    .sendToChannel(
      channelId,
      {
        title: authorName,
        body: message.content.substring(0, 200),
        data: { channelId, messageId: message.id },
      },
      userId,
    )
    .catch(() => {
      /* swallow push errors */
    });

  return message;
}

export async function deleteMessageAndNotify(
  messageId: string,
  userId: string,
  io: Server | null,
  isAdmin = false,
) {
  const deleted = await deleteMessage(messageId, userId, isAdmin);

  if (io) {
    io.to(SOCKET_ROOMS.channel(deleted.channelId)).emit('message:deleted', {
      id: deleted.id,
      channelId: deleted.channelId,
    });
  }

  return deleted;
}
