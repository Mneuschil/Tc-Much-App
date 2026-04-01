import { prisma } from '../config/database';

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
    throw Object.assign(new Error('Reaction nicht gefunden'), { statusCode: 404 });
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
