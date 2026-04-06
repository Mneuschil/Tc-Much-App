import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { registerHandlers } from './handlers';
import { SOCKET_ROOMS } from '@tennis-club/shared';
import type { TokenPayload } from '@tennis-club/shared';

export function initializeSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
      methods: ['GET', 'POST'],
    },
  });

  // Auth-Middleware fuer Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) {
      return next(new Error('Authentifizierung erforderlich'));
    }

    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Ungueltiger Token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as TokenPayload;
    logger.info('Socket connected', { userId: user.userId, clubId: user.clubId });

    // User joint seinen Club-Room
    socket.join(SOCKET_ROOMS.club(user.clubId));

    registerHandlers(io, socket);

    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { userId: user.userId });
    });
  });

  return io;
}
