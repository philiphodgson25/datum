import 'server-only';
import { z } from 'zod';

const serverEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  SUPABASE_URL: z.string().url().optional().default('http://localhost:54321'),
  SUPABASE_ANON_KEY: z.string().optional().default('dev-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),
  DATABASE_URL: z.string().optional().default(''),
  OPENAI_API_KEY: z.string().optional(),
  CONFIG_SOURCE_VERSION: z.string().default('dev-0')
});

const parsed = serverEnvSchema.parse(process.env);
export const env = parsed;
export type ServerEnv = typeof env;

