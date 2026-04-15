import { createServer } from 'http';
import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';
import { logger } from './utils/logger';
import { initializeSocket } from './socket';
import { syncAllEnabled } from './services/websiteSync.service';

const httpServer = createServer(app);

const io = initializeSocket(httpServer);
app.set('io', io);

httpServer.listen(env.PORT, '0.0.0.0', () => {
  logger.info(`Server laeuft auf Port ${env.PORT}`, {
    env: env.NODE_ENV,
    port: env.PORT,
  });
});

// ─── Website sync scheduler ────────────────────────────────────────
// Opt-in via WEBSITE_SYNC_ENABLED. On a fresh deploy without any SyncSource
// rows configured, syncAllEnabled() is a no-op and this loop costs nothing.

let syncTimer: NodeJS.Timeout | null = null;
if (env.WEBSITE_SYNC_ENABLED && env.NODE_ENV !== 'test') {
  const run = (): void => {
    syncAllEnabled().catch((e) => {
      logger.error('Website sync scheduler tick failed', {
        error: e instanceof Error ? e.message : String(e),
      });
    });
  };
  syncTimer = setInterval(run, env.WEBSITE_SYNC_INTERVAL_MS);
  setTimeout(run, 5_000);
  logger.info('Website sync scheduler enabled', {
    intervalMs: env.WEBSITE_SYNC_INTERVAL_MS,
  });
}

async function shutdown(signal: string) {
  logger.info(`${signal} empfangen. Server wird heruntergefahren...`);

  if (syncTimer) clearInterval(syncTimer);

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
