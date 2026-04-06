import { prisma } from '../config/database';
import type { NotificationType } from '@tennis-club/shared';
import type { Prisma } from '@prisma/client';

// Spec section 15: 7 types, all enabled by default, real-time push, in-app notification center

export async function getNotifications(userId: string, unreadOnly = false) {
  return prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function createNotification(
  type: NotificationType,
  title: string,
  body: string,
  userId: string,
  clubId: string,
  data?: Record<string, unknown>,
) {
  // Check user preferences
  const preference = await prisma.notificationPreference.findUnique({
    where: { userId_type: { userId, type } },
  });

  // All enabled by default (spec)
  if (preference && !preference.enabled) return null;

  return prisma.notification.create({
    data: {
      type,
      title,
      body,
      data: (data ?? undefined) as Prisma.InputJsonValue | undefined,
      userId,
      clubId,
    },
  });
}

export async function markAsRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

export async function getPreferences(userId: string) {
  return prisma.notificationPreference.findMany({
    where: { userId },
  });
}

export async function updatePreference(userId: string, type: NotificationType, enabled: boolean) {
  return prisma.notificationPreference.upsert({
    where: { userId_type: { userId, type } },
    create: { userId, type, enabled },
    update: { enabled },
  });
}
