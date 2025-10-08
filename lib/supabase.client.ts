import { createClient } from '@supabase/supabase-js';
import { publicEnv } from './env.public';

export function createBrowserClient() {
  return createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
