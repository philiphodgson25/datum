'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useLpaLookup } from '../../lib/hooks/useLpaLookup';

const MapPanel = dynamic(() => import('../components/MapPanel'), { ssr: false });

export default function NewPage() {
  const searchParams = useSearchParams();
  const initialAddress = searchParams.get('address') ?? '';
  const [address, setAddress] = useState(initialAddress);
  const [hasSearched, setHasSearched] = useState(Boolean(initialAddress));
  const [statsOpen, setStatsOpen] = useState(false);

  const { lookupByAddress, loading, error, data, stats, statsLoading, statsError } = useLpaLookup();

  useEffect(() => {
    if (initialAddress.trim().length > 0) {
      lookupByAddress(initialAddress);
    }
  }, [initialAddress, lookupByAddress]);

  const onGenerate = async () => {
    await lookupByAddress(address);
    setHasSearched(true);
  };

  const lookupState = useMemo<'idle' | 'loading' | 'error' | 'empty' | 'success'>(() => {
    if (loading) return 'loading';
    if (error) return 'error';
    if (!data && !hasSearched) return 'idle';
    if (!data?.lpa) return 'empty';
    return 'success';
  }, [loading, error, data, hasSearched]);

  const coords = data?.coordinates ?? null;
  const lpa = data?.lpa ?? null;
  const statusClass =
    lpa?.is_active === true ? 'text-green-700' : lpa?.is_active === false ? 'text-yellow-700' : 'text-gray-600';
  const statusText =
    lpa?.is_active === true ? 'Active' : lpa?.is_active === false ? 'Historical' : 'Unknown';

  return (
    <main className="p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 text-2xl font-semibold">New Statement</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void onGenerate();
          }}
          className="grid gap-3"
        >
          <label className="block text-sm font-medium text-gray-700">
            <span className="group relative inline-flex items-center gap-1">
              Address
              <span
                className="ml-1 inline-flex h-4 w-4 -translate-y-0.5 cursor-help items-center justify-center rounded-full border border-gray-400 text-[10px] leading-none text-gray-700"
                aria-label="Geocoding information"
              >
                i
              </span>
              <div className="pointer-events-none absolute -top-2 left-6 z-10 hidden w-80 group-hover:block">
                <div className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 shadow">
                  Using Nominatim (OpenStreetMap) for geocoding (fine for dev; rate-limited, no SLA).<br />
                  Recommended for production: OS Places (UK). Add OS_PLACES_API_KEY and swap the geocoder.
                </div>
              </div>
            </span>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter site address"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
          <div className="mb-6 mt-4">
            <button
              disabled={loading || !address.trim()}
              type="submit"
              className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Looking up…' : 'Generate'}
            </button>
          </div>
        </form>
      </div>

      {error && lookupState === 'error' ? (
        <div className="mx-auto mt-4 max-w-2xl rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>
      ) : null}

      {(lookupState !== 'idle' || loading) && (
        <details open className="mx-auto mt-6 max-w-2xl rounded-lg border bg-white p-6 shadow">
          <summary className="cursor-pointer select-none text-lg font-semibold">Local planning authority</summary>
          <div className="mt-4 space-y-3">
            {lookupState === 'loading' && <div className="text-sm text-gray-600">Looking up…</div>}

            {coords ? (
              <div className="rounded-lg border bg-gray-50 p-4">
                <div className="mb-2 text-xs font-semibold text-gray-600">User-entered/geocoded data:</div>
                <div className="grid grid-cols-1 gap-y-2 gap-x-4 text-sm sm:grid-cols-[180px_1fr]">
                  {coords.display_name ? (
                    <>
                      <div className="font-medium text-gray-700">Address:</div>
                      <div className="text-gray-900">{coords.display_name}</div>
                    </>
                  ) : null}
                  <div className="font-medium text-gray-700">Coordinates:</div>
                  <div className="text-gray-900">
                    lat {coords.lat}, lng {coords.lng}
                  </div>
                </div>
              </div>
            ) : null}

            {lookupState === 'empty' ? (
              <div className="rounded border border-yellow-200 bg-yellow-50 p-3 text-yellow-800">
                No LPA found for this address.
              </div>
            ) : null}

            {lookupState === 'success' && lpa ? (
              <div className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="mb-2 text-xs font-semibold text-gray-600">Database-derived data:</div>
                <div className="grid grid-cols-1 gap-y-2 gap-x-4 text-sm sm:grid-cols-[180px_1fr]">
                  <div className="font-medium text-gray-700">Name:</div>
                  <div className="text-gray-900">{lpa.name ?? '—'}</div>
                  <div className="font-medium text-gray-700">Reference:</div>
                  <div className="text-gray-900">{lpa.reference ?? '—'}</div>
                  <div className="font-medium text-gray-700">Entity:</div>
                  <div className="text-gray-900">{lpa.entity ?? '—'}</div>
                  <div className="font-medium text-gray-700">Status:</div>
                  <div className={statusClass}>{statusText}</div>
                  {lpa.boundary ? (
                    <div className="sm:col-span-2">
                      <details className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <summary className="cursor-pointer text-sm font-medium text-blue-800">
                          Show raw boundary
                        </summary>
                        <pre className="mt-2 max-h-64 overflow-auto rounded bg-white p-2 text-xs">
                          {JSON.stringify(lpa.boundary, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </details>
      )}

      <details
        className="mx-auto mt-4 max-w-2xl rounded-lg border bg-white p-6 shadow"
        open={statsOpen}
        onToggle={(event) => {
          setStatsOpen((event.currentTarget as HTMLDetailsElement).open);
        }}
      >
        <summary className="cursor-pointer select-none text-lg font-semibold">Database stats</summary>
        <div className="mt-4">
          {statsLoading && <div className="text-sm text-gray-600">Loading stats…</div>}
          {statsError ? (
            <div className="rounded border border-yellow-200 bg-yellow-50 p-3 text-yellow-800">{statsError}</div>
          ) : null}
          {stats ? (
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="grid grid-cols-1 gap-y-2 gap-x-4 text-sm sm:grid-cols-[180px_1fr]">
                <div className="font-medium text-gray-700">Total:</div>
                <div className="text-gray-900">{stats.total_lpas}</div>
                <div className="font-medium text-gray-700">Active:</div>
                <div className="text-gray-900">{stats.active_lpas}</div>
                <div className="font-medium text-gray-700">Historical:</div>
                <div className="text-gray-900">{stats.historical_lpas}</div>
                <div className="font-medium text-gray-700">With Boundaries:</div>
                <div className="text-gray-900">{stats.with_boundaries}</div>
              </div>
            </div>
          ) : null}
        </div>
      </details>

      {lpa?.boundary ? (
        <div className="mx-auto mt-6 max-w-4xl">
          <MapPanel boundaryGeoJSON={lpa.boundary} lpaName={lpa.name} />
        </div>
      ) : null}
    </main>
  );
}

