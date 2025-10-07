import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { env } from './lib/env';

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname;
  
  // Always allow callback to proceed
  if (pathname.startsWith('/auth/callback')) return NextResponse.next();
  // Allow home page
  if (pathname === '/') return NextResponse.next();

  // Check authentication for protected routes and redirect signed-in users away from auth pages
  const isProtected = pathname.startsWith('/new') || pathname.startsWith('/runs') || pathname.startsWith('/api/das');
  const isAuthSignIn = pathname === '/auth/sign-in';
  if (isProtected || isAuthSignIn) {
    const res = NextResponse.next();
    const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
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

    try {
      const { data } = await supabase.auth.getUser();
      if (isProtected && !data.user) {
        const redirectUrl = new URL('/auth/sign-in', url.origin);
        return NextResponse.redirect(redirectUrl);
      }
      if (isAuthSignIn && data.user) {
        const redirectUrl = new URL('/', url.origin);
        return NextResponse.redirect(redirectUrl);
      }
      return res;
    } catch (error) {
      console.log('Auth check error:', error);
      const redirectUrl = new URL('/auth/sign-in', url.origin);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|static|.*\.[\w]+).*)']
};

