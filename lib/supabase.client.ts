import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr';

export function createBrowserClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL as string) || '';
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) || '';
  return createSSRBrowserClient(url, key);
}

