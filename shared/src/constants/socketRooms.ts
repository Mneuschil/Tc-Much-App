export const SOCKET_ROOMS = {
  club: (clubId: string) => `club:${clubId}` as const,
  channel: (channelId: string) => `channel:${channelId}` as const,
};
