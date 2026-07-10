import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  STREAM_KEY: z.string().min(1, 'STREAM_KEY is required'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validate(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.format());
    process.exit(1);
  }
  return result.data;
}
