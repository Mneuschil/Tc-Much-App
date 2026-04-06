import { env } from '../config/env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = LOG_LEVELS[env.NODE_ENV === 'production' ? 'info' : 'debug'];

function formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  if (env.NODE_ENV === 'production') {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    });
  }

  const timestamp = new Date().toISOString().split('T')[1]?.replace('Z', '') ?? '';
  const requestId = meta?.requestId ? ` [${meta.requestId}]` : '';
  const filteredMeta = meta
    ? Object.fromEntries(Object.entries(meta).filter(([k]) => k !== 'requestId'))
    : undefined;
  const metaStr =
    filteredMeta && Object.keys(filteredMeta).length > 0 ? ` ${JSON.stringify(filteredMeta)}` : '';
  return `[${timestamp}] ${level.toUpperCase().padEnd(5)}${requestId} ${message}${metaStr}`;
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  if (LOG_LEVELS[level] < currentLevel) return;

  const formatted = formatMessage(level, message, meta);

  switch (level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
};
