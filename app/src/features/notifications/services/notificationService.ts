import api from '../../../lib/api';
import { ENDPOINTS } from '../../../lib/endpoints';
import type { NotificationType } from '@tennis-club/shared';

export const notificationService = {
  getNotifications: (unreadOnly = false) =>
    api
      .get(ENDPOINTS.notifications.list, { params: unreadOnly ? { unread: true } : undefined })
      .then((r) => r.data.data),

  markAsRead: (notificationId: string) =>
    api.put(ENDPOINTS.notifications.markAsRead(notificationId)).then((r) => r.data),

  markAllAsRead: () => api.put(ENDPOINTS.notifications.markAllAsRead).then((r) => r.data),

  getPreferences: () => api.get(ENDPOINTS.notifications.preferences).then((r) => r.data.data),

  updatePreference: (type: NotificationType, enabled: boolean) =>
    api.put(ENDPOINTS.notifications.preferences, { type, enabled }).then((r) => r.data),
};
