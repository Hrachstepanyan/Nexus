/**
 * Environment configuration with validation
 */
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000').transform(Number),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  QUIVR_SERVICE_URL: z.string().url().default('http://localhost:8000'),
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'debug'])
    .default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten());
  process.exit(1);
}

export const env = parsed.data;

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
