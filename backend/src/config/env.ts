import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_URL: z.string().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),

  CORS_ORIGIN: z.string().default('http://localhost:8081'),

  UPLOAD_DIR: z.string().default('/var/www/uploads'),
  MAX_FILE_SIZE: z.coerce.number().default(5242880),

  N8N_WEBHOOK_BASE_URL: z.string().default('http://localhost:5678/webhook'),
  WEBHOOK_SECRET: z.string().min(32, 'WEBHOOK_SECRET must be at least 32 characters'),

  EXPO_ACCESS_TOKEN: z.string().optional(),

  WEBSITE_SYNC_ENABLED: z.coerce.boolean().default(false),
  WEBSITE_SYNC_INTERVAL_MS: z.coerce.number().min(60_000).default(300_000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
