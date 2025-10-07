'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
const MapPanel = dynamic(() => import('../components/MapPanel'), { ssr: false });

export default function NewPage() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lpa, setLpa] = useState<any>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number; display_name?: string } | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState<
    | null
    | {
        total_lpas: number;
        active_lpas: number;
        historical_lpas: number;
        with_boundaries: number;
      }
  >(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  const onGenerate = async () => {
    setLoading(true);
    setError(null);
    setLpa(null);
    setCoords(null);
    try {
      const res = await fetch('/api/lpa/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
        cache: 'no-store'
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || 'Lookup failed');
        return;
      }
      setCoords(json.coordinates ?? null);
      setLpa(json.lpa ?? null);
    } catch (e: any) {
      setError(e?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">New Statement</h1>
        <form onSubmit={(e) => e.preventDefault()} className="grid gap-3">
          <label className="block text-sm font-medium text-gray-700">
            <span className="relative inline-flex items-center gap-1 group">
              Address
              <span
                className="ml-1 inline-flex h-4 w-4 -translate-y-0.5 items-center justify-center rounded-full border border-gray-400 text-gray-700 text-[10px] leading-none cursor-help"
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
          <div className="mt-4 mb-6">
            <button
              disabled={loading || !address}
              type="button"
              onClick={onGenerate}
              className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Looking up…' : 'Generate'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="max-w-2xl mx-auto mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {(lpa || coords || loading) && (
        <details open className="mt-6 rounded-lg border bg-white p-6 shadow max-w-2xl mx-auto">
          <summary className="cursor-pointer select-none text-lg font-semibold">
            Local planning authority
          </summary>
          <div className="mt-4 space-y-3">
            {loading && <div className="text-sm text-gray-600">Looking up…</div>}

            {coords && (
              <div className="rounded-lg border bg-gray-50 p-4">
                <div className="mb-2 text-xs font-semibold text-gray-600">User-entered/geocoded data:</div>
                <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-4 gap-y-2 text-sm">
                  {coords.display_name && (
                    <>
                      <div className="font-medium text-gray-700">Address:</div>
                      <div className="text-gray-900">{coords.display_name}</div>
                    </>
                  )}
                  <div className="font-medium text-gray-700">Coordinates:</div>
                  <div className="text-gray-900">
                    lat {coords.lat}, lng {coords.lng}
                  </div>
                </div>
              </div>
            )}

            {lpa ? (
              <div>
                <div className="mb-2 text-xs font-semibold text-gray-600">Database-derived data:</div>
                <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-4 gap-y-2 text-sm">
                <div className="font-medium text-gray-700">Name:</div>
                <div className="text-gray-900">{lpa.name}</div>
                <div className="font-medium text-gray-700">Reference:</div>
                <div className="text-gray-900">{lpa.reference}</div>
                <div className="font-medium text-gray-700">Entity:</div>
                <div className="text-gray-900">{lpa.entity}</div>
                <div className="font-medium text-gray-700">Status:</div>
                <div className={lpa.is_active ? 'text-green-700' : 'text-red-700'}>
                  {lpa.is_active ? 'Active' : 'Historical'}
                </div>

                {lpa.boundary && (
                  <>
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
                  </>
                )}
                </div>
              </div>
            ) : (
              !loading && (
                <div className="rounded border border-yellow-200 bg-yellow-50 p-3 text-yellow-800">No LPA found for this address.</div>
              )
            )}
          </div>
        </details>
      )}

      {/* Accordion 2: Database stats (lazy) */}
      <details className="mt-4 rounded-lg border bg-white p-6 shadow max-w-2xl mx-auto"
        onToggle={async (e) => {
          const isOpen = (e.currentTarget as HTMLDetailsElement).open;
          setStatsOpen(isOpen);
          if (isOpen && !stats && !statsLoading) {
            setStatsLoading(true);
            setStatsError(null);
            try {
              const res = await fetch('/api/lpa/stats', { cache: 'no-store' });
              const json = await res.json();
              if (!res.ok) {
                setStatsError(json?.error || 'Could not load stats');
              } else {
                setStats(json);
              }
            } catch (e: any) {
              setStatsError(e?.message || 'Could not load stats');
            } finally {
              setStatsLoading(false);
            }
          }
        }}
      >
        <summary className="cursor-pointer select-none text-lg font-semibold">Database stats</summary>
        <div className="mt-4">
          {statsLoading && <div className="text-sm text-gray-600">Loading stats…</div>}
          {statsError && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{statsError}</div>
          )}
          {stats && (
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-4 gap-y-2 text-sm">
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
          )}
        </div>
      </details>

      {lpa && (
        <div className="mt-6 max-w-4xl mx-auto">
          <MapPanel boundaryGeoJSON={lpa.boundary ?? null} lpaName={lpa.name} />
        </div>
      )}
    </main>
  );
}

