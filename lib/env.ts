import 'server-only';
import { z } from 'zod';
import { publicEnvSchema } from './env.shared';

const serverEnvSchema = z.object({
  SUPABASE_URL: z.string().url().default('http://localhost:54321'),
  SUPABASE_ANON_KEY: z.string().min(1).default('dev-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),
  DATABASE_URL: z.string().optional().default(''),
  OPENAI_API_KEY: z.string().optional(),
  NOMINATIM_USER_AGENT: z.string().optional(),
  CONFIG_SOURCE_VERSION: z.string().default('dev-0')
});

const clean = (value: string | undefined | null) => value?.trim() || undefined;

const warnFallback = (key: string, fallback: string) => {
  // eslint-disable-next-line no-console
  console.warn(`[env] ${key} not set; using fallback "${fallback}". Please configure this in .env.local.`);
  return fallback;
};

const rawServerEnv = {
  SUPABASE_URL:
    clean(process.env.SUPABASE_URL) ??
    clean(process.env.NEXT_PUBLIC_SUPABASE_URL) ??
    warnFallback('SUPABASE_URL', 'http://localhost:54321'),
  SUPABASE_ANON_KEY:
    clean(process.env.SUPABASE_ANON_KEY) ??
    clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ??
    warnFallback('SUPABASE_ANON_KEY', 'dev-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY:
    clean(process.env.SUPABASE_SERVICE_ROLE_KEY) ?? warnFallback('SUPABASE_SERVICE_ROLE_KEY', ''),
  DATABASE_URL: clean(process.env.DATABASE_URL) ?? '',
  OPENAI_API_KEY: clean(process.env.OPENAI_API_KEY),
  NOMINATIM_USER_AGENT: clean(process.env.NOMINATIM_USER_AGENT),
  CONFIG_SOURCE_VERSION: clean(process.env.CONFIG_SOURCE_VERSION) ?? 'dev-0'
};

export const env = serverEnvSchema.parse(rawServerEnv);

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
});

export type ServerEnv = typeof env;
export type PublicEnv = typeof publicEnv;
