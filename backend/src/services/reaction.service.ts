import { prisma } from '../config/database';
import { SOCKET_ROOMS } from '@tennis-club/shared';
import type { Server } from 'socket.io';
import { AppError } from '../utils/AppError';

type ReactionType = 'THUMBS_UP' | 'HEART' | 'CELEBRATE' | 'THINKING';

const ALL_REACTION_TYPES: ReactionType[] = ['THUMBS_UP', 'HEART', 'CELEBRATE', 'THINKING'];

export async function addReaction(messageId: string, userId: string, type: ReactionType) {
  return prisma.messageReaction.create({
    data: { messageId, userId, type },
  });
}

export async function removeReaction(messageId: string, userId: string, type: ReactionType) {
  const reaction = await prisma.messageReaction.findUnique({
    where: { messageId_userId_type: { messageId, userId, type } },
  });
  if (!reaction) {
    throw AppError.notFound('Reaction nicht gefunden');
  }
  return prisma.messageReaction.delete({ where: { id: reaction.id } });
}

export async function getAggregatedReactions(messageId: string, currentUserId: string) {
  const reactions = await prisma.messageReaction.findMany({
    where: { messageId },
    select: { type: true, userId: true },
  });

  const counts: Record<string, number> = {};
  for (const t of ALL_REACTION_TYPES) {
    counts[t] = 0;
  }

  const userReactions: string[] = [];

  for (const r of reactions) {
    counts[r.type]++;
    if (r.userId === currentUserId) {
      userReactions.push(r.type);
    }
  }

  return { ...counts, userReactions };
}

interface ReactionNotifyContext {
  messageId: string;
  userId: string;
  clubId: string;
  io: Server | null;
}

export async function addReactionAndNotify(ctx: ReactionNotifyContext, type: ReactionType) {
  const reaction = await addReaction(ctx.messageId, ctx.userId, type);
  const aggregated = await getAggregatedReactions(ctx.messageId, ctx.userId);

  if (ctx.io) {
    ctx.io.to(SOCKET_ROOMS.club(ctx.clubId)).emit('message:reaction', {
      messageId: ctx.messageId,
      action: 'added',
      type,
      userId: ctx.userId,
      reactions: aggregated,
    });
  }

  return { reaction, reactions: aggregated };
}

export async function removeReactionAndNotify(ctx: ReactionNotifyContext, type: ReactionType) {
  await removeReaction(ctx.messageId, ctx.userId, type);
  const aggregated = await getAggregatedReactions(ctx.messageId, ctx.userId);

  if (ctx.io) {
    ctx.io.to(SOCKET_ROOMS.club(ctx.clubId)).emit('message:reaction', {
      messageId: ctx.messageId,
      action: 'removed',
      type,
      userId: ctx.userId,
      reactions: aggregated,
    });
  }

  return { reactions: aggregated };
}
