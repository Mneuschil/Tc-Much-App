import { Server, Socket } from 'socket.io';
import type { TokenPayload } from '@tennis-club/shared';
import { prisma } from '../config/database';

export function registerHandlers(_io: Server, socket: Socket): void {
  const user = socket.data.user as TokenPayload;

  // Auto-join all accessible channel rooms on connect
  joinUserChannels(socket, user);

  // Manual join/leave for dynamic channel switching
  socket.on('channel:join', (channelId: string) => {
    socket.join(`channel:${channelId}`);
  });

  socket.on('channel:leave', (channelId: string) => {
    socket.leave(`channel:${channelId}`);
  });
}

async function joinUserChannels(socket: Socket, user: TokenPayload): Promise<void> {
  const isPrivileged = user.roles.some(r =>
    ['CLUB_ADMIN', 'SYSTEM_ADMIN', 'BOARD_MEMBER'].includes(r),
  );

  let channels: { id: string }[];

  if (isPrivileged) {
    // Privileged users see all club channels
    channels = await prisma.channel.findMany({
      where: { clubId: user.clubId },
      select: { id: true },
    });
  } else {
    // Regular users: PUBLIC + explicit membership
    channels = await prisma.channel.findMany({
      where: {
        clubId: user.clubId,
        OR: [
          { visibility: 'PUBLIC' },
          { members: { some: { userId: user.userId } } },
        ],
      },
      select: { id: true },
    });
  }

  for (const ch of channels) {
    socket.join(`channel:${ch.id}`);
  }
}
