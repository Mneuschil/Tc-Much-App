import { createServer } from 'http';
import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';
import { logger } from './utils/logger';
import { initializeSocket } from './socket';

const httpServer = createServer(app);

const io = initializeSocket(httpServer);
app.set('io', io);

httpServer.listen(env.PORT, () => {
  logger.info(`Server laeuft auf Port ${env.PORT}`, {
    env: env.NODE_ENV,
    port: env.PORT,
  });
});

async function shutdown(signal: string) {
  logger.info(`${signal} empfangen. Server wird heruntergefahren...`);

  httpServer.close(() => {
    logger.info('HTTP Server geschlossen');
  });

  io.close();
  await prisma.$disconnect();

  logger.info('Shutdown abgeschlossen');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
