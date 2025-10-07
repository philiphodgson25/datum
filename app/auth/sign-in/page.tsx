'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '../../../lib/supabase.client';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const supabase = createBrowserClient();
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setAuthed(true);
        router.replace('/');
      }
    };
    check();
  }, [router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const supabase = createBrowserClient();
      const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`;
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo
        }
      });
      if (authError) throw authError;
      setMessage('Check your email for the sign-in link.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (authed) return null;

  return (
    <main style={{ padding: 24 }}>
      <h1>Enter your address:</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            style={{ width: '100%', padding: 8 }}
          />
        </label>
        <button disabled={loading || !email} type="submit">
          {loading ? 'Sending…' : 'Send magic link'}
        </button>
      </form>
      {message ? <p style={{ marginTop: 16 }}>{message}</p> : null}
      {error ? (
        <p style={{ marginTop: 16, color: 'crimson' }}>Error: {error}</p>
      ) : null}
    </main>
  );
}

