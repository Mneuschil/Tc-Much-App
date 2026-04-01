// ─── Chat System (spec section 5) ───────────────────────────────────

export enum ChannelVisibility {
  PUBLIC = 'PUBLIC',
  RESTRICTED = 'RESTRICTED',
}

// Spec: "Reactions (4 types)"
export enum ReactionType {
  THUMBS_UP = 'THUMBS_UP',
  HEART = 'HEART',
  CELEBRATE = 'CELEBRATE',
  THINKING = 'THINKING',
}

// Default channels per spec section 5
export const DEFAULT_CHANNELS = [
  { name: 'General', visibility: ChannelVisibility.PUBLIC },
  { name: 'Tournaments', visibility: ChannelVisibility.PUBLIC },
  { name: 'Youth', visibility: ChannelVisibility.RESTRICTED },
  { name: 'Training', visibility: ChannelVisibility.RESTRICTED },
  { name: 'Team', visibility: ChannelVisibility.RESTRICTED },
  { name: 'Board', visibility: ChannelVisibility.RESTRICTED },
] as const;

export interface Channel {
  id: string;
  name: string;
  description: string | null;
  visibility: ChannelVisibility;
  isDefault: boolean;
  parentChannelId: string | null; // Subchannel (max 1 level)
  teamId: string | null;
  clubId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelMember {
  id: string;
  channelId: string;
  userId: string;
  createdAt: string;
}

export interface ChannelMute {
  id: string;
  channelId: string;
  userId: string;
  createdAt: string;
}

// Spec: "Reply to specific message (no threads)"
export interface Message {
  id: string;
  content: string;
  mediaUrls: string[];
  channelId: string;
  authorId: string;
  replyToId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  type: ReactionType;
  createdAt: string;
}
