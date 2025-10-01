import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { env } from './lib/env';

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname;
  if (pathname.startsWith('/auth')) return NextResponse.next();
  if (pathname === '/') return NextResponse.next();

  if (pathname.startsWith('/new') || pathname.startsWith('/runs') || pathname.startsWith('/api/das')) {
    const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        }
      }
    });
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      const redirectUrl = new URL('/auth/sign-in', url.origin);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|static|.*\.[\w]+).*)']
};

