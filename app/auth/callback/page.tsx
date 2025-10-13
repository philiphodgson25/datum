'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '../../../lib/supabase.client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = createBrowserClient();
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (exchangeError) {
          setError(exchangeError.message);
          router.replace('/auth/sign-in?error=callback');
          return;
        }
        router.replace('/');
      } catch (e: any) {
        setError(e?.message ?? 'Unknown error');
        router.replace('/auth/sign-in?error=callback');
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>Signing you in…</h1>
      {error ? <p style={{ color: 'crimson' }}>Error: {error}</p> : null}
    </main>
  );
}

