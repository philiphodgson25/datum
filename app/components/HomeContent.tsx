'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '../../lib/supabase.client';
import { SignInForm } from './SignInForm';
import { AddressLookup } from './AddressLookup';

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
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <header>
          <h1 className="text-2xl font-semibold text-gray-900">Check an address</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter a site address to fetch the local planning authority, conservation areas, and flood
            risk information directly from Supabase.
          </p>
        </header>
        <AddressLookup />
        <p className="text-sm text-gray-700">
          <Link className="text-blue-700 underline" href="/runs">
            See previous searches
          </Link>
          <span className="mx-2 text-gray-400">•</span>
          <Link className="text-blue-700 underline" href="/new">
            Open the full statement builder
          </Link>
        </p>
      </div>
    </main>
  );
}

