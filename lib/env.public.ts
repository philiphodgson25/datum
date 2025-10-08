import { publicEnvSchema } from './env.shared';

const clean = (value: string | undefined | null) => value?.trim() || undefined;
const warnFallback = (key: string, fallback: string) => {
  // eslint-disable-next-line no-console
  console.warn(`[env] ${key} not set; using fallback "${fallback}". Please configure this in .env.local.`);
  return fallback;
};

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: clean(process.env.NEXT_PUBLIC_APP_URL) ?? warnFallback('NEXT_PUBLIC_APP_URL', 'http://localhost:3030'),
  NEXT_PUBLIC_SUPABASE_URL:
    clean(process.env.NEXT_PUBLIC_SUPABASE_URL) ??
    clean(process.env.SUPABASE_URL) ??
    warnFallback('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ??
    clean(process.env.SUPABASE_ANON_KEY) ??
    warnFallback('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'dev-anon-key')
});

export type PublicEnv = typeof publicEnv;
