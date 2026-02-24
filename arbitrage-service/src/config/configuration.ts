import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .url()
    .default('postgresql://nexus:nexus_password@localhost:5432/arbitrage_db'),
  ARBITRAGE_SERVICE_PORT: z
    .string()
    .default('4000')
    .transform(Number),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  USE_MOCK_SCRAPER: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  PROXY_LIST: z.string().default(''),
  SCRAPER_MAX_BROWSERS: z
    .string()
    .default('3')
    .transform(Number),
  SCRAPER_RATE_LIMIT_MIN_MS: z
    .string()
    .default('2000')
    .transform(Number),
  SCRAPER_RATE_LIMIT_MAX_MS: z
    .string()
    .default('5000')
    .transform(Number),
});

export type EnvConfig = z.infer<typeof envSchema>;

export default () => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten());
    process.exit(1);
  }

  const env = parsed.data;

  return {
    port: env.ARBITRAGE_SERVICE_PORT,
    nodeEnv: env.NODE_ENV,
    databaseUrl: env.DATABASE_URL,
    scraper: {
      useMock: env.USE_MOCK_SCRAPER,
      proxyList: env.PROXY_LIST
        ? env.PROXY_LIST.split(',').map((p) => p.trim())
        : [],
      maxBrowsers: env.SCRAPER_MAX_BROWSERS,
      rateLimitMinMs: env.SCRAPER_RATE_LIMIT_MIN_MS,
      rateLimitMaxMs: env.SCRAPER_RATE_LIMIT_MAX_MS,
    },
  };
};
