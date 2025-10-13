'use client';

import { useSearchParams } from 'next/navigation';
import { AddressLookup } from '../components/AddressLookup';

export default function NewPage() {
  const searchParams = useSearchParams();
  const initialAddress = searchParams.get('address') ?? '';

  return (
    <main className="p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header>
          <h1 className="text-2xl font-semibold text-gray-900">Address lookup</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter an address to fetch all of the matching planning context from Supabase—local planning authority,
            conservation areas, and flood risk zones—in a single list.
          </p>
        </header>
        <AddressLookup initialAddress={initialAddress} />
      </div>
    </main>
  );
}
