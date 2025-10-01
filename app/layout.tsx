import type { ReactNode } from 'react';
import Link from 'next/link';
import { getCurrentUser } from '../lib/auth';

export const metadata = {
  title: 'DA Statement',
  description: 'Generate Design & Access Statements for England'
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en">
      <body style={{ background: '#f4f1ed', color: '#1a1a1a' }}>
        <header style={{ padding: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/">DA Statement</Link>
          <div style={{ marginLeft: 'auto' }}>
            {user ? (
              <span>
                Signed in as {user.email || user.id} · <Link href="/auth/sign-out">Sign out</Link>
              </span>
            ) : (
              <Link href="/auth/sign-in">Sign in</Link>
            )}
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}

