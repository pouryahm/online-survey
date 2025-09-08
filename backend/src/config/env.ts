import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),  // 15m, 1h, ...
  JWT_REFRESH_EXPIRES: z.string().default('7d'),  // 7d, 30d, ...
});

export const env = schema.parse(process.env);
