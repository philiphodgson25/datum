import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient as createSSRServerClient } from '@supabase/ssr';
import { env } from '../../../lib/env';

export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/', req.url));
  const supabase = createSSRServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        res.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        res.cookies.set({ name, value: '', ...options });
      }
    }
  });
  await supabase.auth.signOut();
  return res;
}

