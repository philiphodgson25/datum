import 'server-only';
import { z } from 'zod';
import { publicEnvSchema } from './env.shared';

const serverEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  OPENAI_API_KEY: z.string().optional(),
  NOMINATIM_USER_AGENT: z.string().optional(),
  CONFIG_SOURCE_VERSION: z.string().default('dev-0')
});

export const env = serverEnvSchema.parse({
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  NOMINATIM_USER_AGENT: process.env.NOMINATIM_USER_AGENT,
  CONFIG_SOURCE_VERSION: process.env.CONFIG_SOURCE_VERSION ?? 'dev-0'
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
});

export type ServerEnv = typeof env;
export type PublicEnv = typeof publicEnv;

