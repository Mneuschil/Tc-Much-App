// ─── Notifications (spec section 15) ────────────────────────────────

// Spec: 7 notification types
export enum NotificationType {
  CHAT_MESSAGE = 'CHAT_MESSAGE',
  MENTION = 'MENTION',
  AVAILABILITY_REQUEST = 'AVAILABILITY_REQUEST',
  RESULT_CONFIRMATION = 'RESULT_CONFIRMATION',
  EVENT_CHANGE = 'EVENT_CHANGE',
  TODO = 'TODO',
  SYSTEM = 'SYSTEM',
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  userId: string;
  clubId: string;
  isRead: boolean;
  createdAt: string;
}

// Spec: "all enabled by default"
export interface NotificationPreference {
  id: string;
  userId: string;
  type: NotificationType;
  enabled: boolean;
}
