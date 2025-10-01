'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

export default function NewPage() {
  const [address, setAddress] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/das', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
        credentials: 'include'
      });
      const json = await res.json();
      setResult(json);
    } catch (err) {
      setResult({ error: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>New Statement</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
        <label>
          Address
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter site address"
            style={{ width: '100%', padding: 8 }}
          />
        </label>
        <button disabled={loading || !address} type="submit">
          {loading ? 'Submitting…' : 'Generate'}
        </button>
      </form>
      {result ? (
        <pre style={{ marginTop: 24, background: '#eee', padding: 12 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </main>
  );
}

