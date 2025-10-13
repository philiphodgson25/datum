import type { ReactNode } from 'react';
import './globals.css';
import Link from 'next/link';
import { AuthLink } from './components/AuthLink';

export const metadata = {
  title: 'DA Statement',
  description: 'Generate Design & Access Statements for England'
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="bg-stone-100 text-neutral-900">
        <header className="flex items-center gap-3 p-3">
          <Link href="/">Company Name</Link>
          <div className="ml-auto">
            <AuthLink />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
