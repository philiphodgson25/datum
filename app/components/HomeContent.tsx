'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '../../lib/supabase.client';
import { SignInForm } from './SignInForm';

export function HomeContent() {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient();
    const check = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setIsAuthed(Boolean(data.session?.user));
      } catch {
        setIsAuthed(false);
      }
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthed(Boolean(session?.user));
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  // While determining, optimistically show sign-in (will flip instantly if authed)
  const isSignedIn = Boolean(isAuthed);

  if (!isSignedIn) {
    return (
      <main className="p-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-semibold mb-4">Sign in to Start:</h1>
          <SignInForm />
        </div>
      </main>
    );
  }

  return (
    <main className="p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Enter your address:</h1>
        <form action="/new" method="get" className="grid gap-3 max-w-md">
          <label className="block text-sm font-medium text-gray-700">
            Address
            <input name="address" placeholder="Enter site address" className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
          </label>
          <button type="submit" className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Search
          </button>
        </form>
        <p className="mt-3">
          <Link className="text-blue-700 underline" href="/runs">See previous searches</Link>
        </p>
      </div>
    </main>
  );
}


