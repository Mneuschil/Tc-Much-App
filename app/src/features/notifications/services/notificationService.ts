import api from '../../../lib/api';
import type { NotificationType } from '@tennis-club/shared';

export const notificationService = {
  getNotifications: (unreadOnly = false) =>
    api.get(`/notifications${unreadOnly ? '?unread=true' : ''}`).then(r => r.data.data),

  markAsRead: (notificationId: string) =>
    api.put(`/notifications/${notificationId}/read`).then(r => r.data),

  markAllAsRead: () =>
    api.put('/notifications/read-all').then(r => r.data),

  getPreferences: () =>
    api.get('/notifications/preferences').then(r => r.data.data),

  updatePreference: (type: NotificationType, enabled: boolean) =>
    api.put('/notifications/preferences', { type, enabled }).then(r => r.data),
};
