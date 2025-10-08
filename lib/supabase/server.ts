import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../env';

export function supabaseServer(): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false
    }
  });
}

