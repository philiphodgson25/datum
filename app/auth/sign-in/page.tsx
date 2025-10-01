'use client';

import React, { useState } from 'react';
import { createBrowserClient } from '../../../lib/supabase.client';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <main style={{ padding: 24 }}>
      <h1>Sign in</h1>
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

