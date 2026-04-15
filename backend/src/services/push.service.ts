import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushReceiptId } from 'expo-server-sdk';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from '../utils/AppError';

const expo = new Expo();

export { expo };

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function registerToken(userId: string, token: string, platform: 'IOS' | 'ANDROID') {
  if (!Expo.isExpoPushToken(token)) {
    throw AppError.badRequest('Ungueltiger Push-Token', 'INVALID_TOKEN');
  }

  return prisma.pushToken.upsert({
    where: { token },
    update: { userId, platform, updatedAt: new Date() },
    create: { userId, token, platform },
  });
}

export async function deactivateToken(token: string) {
  const existing = await prisma.pushToken.findUnique({ where: { token } });
  if (!existing) {
    throw AppError.notFound('Token nicht gefunden');
  }
  return prisma.pushToken.delete({ where: { token } });
}

async function getTokensForUsers(userIds: string[]): Promise<string[]> {
  const tokens = await prisma.pushToken.findMany({
    where: { userId: { in: userIds } },
    select: { token: true },
  });
  return tokens.map((t) => t.token);
}

async function sendPush(tokens: string[], payload: PushPayload): Promise<ExpoPushTicket[]> {
  if (tokens.length === 0) return [];

  const messages: ExpoPushMessage[] = tokens
    .filter((token) => Expo.isExpoPushToken(token))
    .map((token) => ({
      to: token,
      sound: 'default' as const,
      title: payload.title,
      body: payload.body,
      data: payload.data,
    }));

  if (messages.length === 0) return [];

  const chunks = expo.chunkPushNotifications(messages);
  const tickets: ExpoPushTicket[] = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (err) {
      logger.error('Push notification chunk failed', { error: (err as Error).message });
    }
  }

  return tickets;
}

export async function sendToUser(userId: string, payload: PushPayload): Promise<ExpoPushTicket[]> {
  const tokens = await getTokensForUsers([userId]);
  return sendPush(tokens, payload);
}

export async function sendToUsers(
  userIds: string[],
  payload: PushPayload,
): Promise<ExpoPushTicket[]> {
  const tokens = await getTokensForUsers(userIds);
  return sendPush(tokens, payload);
}

export async function sendToChannel(
  channelId: string,
  payload: PushPayload,
  excludeUserId?: string,
): Promise<ExpoPushTicket[]> {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: { clubId: true, visibility: true },
  });
  if (!channel) return [];

  // Get muted user IDs for this channel
  const mutes = await prisma.channelMute.findMany({
    where: { channelId },
    select: { userId: true },
  });
  const mutedIds = new Set(mutes.map((m) => m.userId));

  let userIds: string[];

  if (channel.visibility === 'PUBLIC') {
    const users = await prisma.user.findMany({
      where: { clubId: channel.clubId, isActive: true },
      select: { id: true },
    });
    userIds = users.map((u) => u.id);
  } else {
    const [members, privileged] = await Promise.all([
      prisma.channelMember.findMany({
        where: { channelId },
        select: { userId: true },
      }),
      prisma.userRoleAssignment.findMany({
        where: {
          clubId: channel.clubId,
          role: { in: ['CLUB_ADMIN', 'SYSTEM_ADMIN', 'BOARD_MEMBER'] },
        },
        select: { userId: true },
      }),
    ]);
    const ids = new Set([...members.map((m) => m.userId), ...privileged.map((p) => p.userId)]);
    userIds = [...ids];
  }

  const filteredIds = userIds.filter((id) => id !== excludeUserId && !mutedIds.has(id));
  const tokens = await getTokensForUsers(filteredIds);
  return sendPush(tokens, payload);
}

export async function sendToTeam(
  teamId: string,
  payload: PushPayload,
  excludeUserId?: string,
): Promise<ExpoPushTicket[]> {
  const members = await prisma.teamMember.findMany({
    where: { teamId },
    select: { userId: true },
  });
  const userIds = members.map((m) => m.userId).filter((id) => id !== excludeUserId);
  const tokens = await getTokensForUsers(userIds);
  return sendPush(tokens, payload);
}

export async function handlePushReceipts(
  ticketIds: ExpoPushReceiptId[],
): Promise<{ deactivated: number }> {
  if (ticketIds.length === 0) return { deactivated: 0 };

  let deactivated = 0;
  const receiptChunks = expo.chunkPushNotificationReceiptIds(ticketIds);

  for (const chunk of receiptChunks) {
    try {
      const receipts = await expo.getPushNotificationReceiptsAsync(chunk);

      for (const [receiptId, receipt] of Object.entries(receipts)) {
        if (receipt.status === 'error') {
          logger.error('Push receipt error', {
            receiptId,
            message: receipt.message,
            details: receipt.details,
          });

          if (receipt.details?.error === 'DeviceNotRegistered') {
            deactivated++;
            logger.info('Deactivating invalid push token from receipt', { receiptId });
          }
        }
      }
    } catch (err) {
      logger.error('Failed to get push receipts', { error: (err as Error).message });
    }
  }

  return { deactivated };
}
