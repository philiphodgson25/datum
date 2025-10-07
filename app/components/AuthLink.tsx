'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '../../lib/supabase.client';

export function AuthLink() {
  const [isAuthed, setIsAuthed] = useState<boolean>(false);

  useEffect(() => {
    const supabase = createBrowserClient();
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthed(Boolean(data.session?.user));
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(Boolean(session?.user));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (isAuthed) {
    return (
      <a
        href="#"
        onClick={async (e) => {
          e.preventDefault();
          const supabase = createBrowserClient();
          await supabase.auth.signOut();
          // ensure server cookies are cleared too
          window.location.href = '/auth/sign-out';
        }}
      >
        Sign out
      </a>
    );
  }
  return <Link href="/auth/sign-in">Sign in</Link>;
}


