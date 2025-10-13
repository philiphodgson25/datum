'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  DESIGNATION_DATASET_KEYS,
  DESIGNATION_DATASET_LABELS,
  addressLookupResponseSchema,
  type AddressLookupResponse,
  type DesignationItem
} from '../../lib/schemas/address';

type AddressLookupProps = {
  initialAddress?: string;
  className?: string;
};

function formatLatLng(lat: number, lng: number) {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

const ADDITIONAL_SECTIONS = DESIGNATION_DATASET_KEYS.map((key) => ({
  key,
  title: DESIGNATION_DATASET_LABELS[key]
}));

export function AddressLookup({ initialAddress = '', className }: AddressLookupProps) {
  const normalisedInitial = (initialAddress ?? '').trim();
  const [address, setAddress] = useState(normalisedInitial);
  const [result, setResult] = useState<AddressLookupResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(normalisedInitial.length > 0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const handleLookup = useCallback(
    async (value: string) => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);
      setResult(null);
      setHasSearched(true);

      try {
        const response = await fetch('/api/address/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: value }),
          credentials: 'include',
          signal: controller.signal
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            (payload && typeof payload === 'object' && payload !== null && 'error' in payload
              ? (payload as { error?: string }).error
              : null) || 'Lookup failed';
          throw new Error(message ?? 'Lookup failed');
        }

        if (!payload) {
          throw new Error('Empty response from server');
        }

        const parsed = addressLookupResponseSchema.parse(payload);
        setResult(parsed);
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Lookup failed');
        setResult(null);
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    []
  );

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = address.trim();
      if (!trimmed) {
        setError('Please enter an address');
        setResult(null);
        setHasSearched(false);
        return;
      }
      await handleLookup(trimmed);
    },
    [address, handleLookup]
  );

  useEffect(() => {
    const trimmed = (initialAddress ?? '').trim();
    if (trimmed.length > 0) {
      setAddress(trimmed);
      void handleLookup(trimmed);
    }
  }, [initialAddress, handleLookup]);

  const datasets = result?.datasets ?? null;
  const coordinates = result?.coordinates ?? null;

  const hasAnyData = useMemo(() => {
    if (!result) return false;
    const baseCounts =
      (datasets?.conservationAreas.length ?? 0) + (datasets?.floodZones.length ?? 0);
    const additionalCounts = DESIGNATION_DATASET_KEYS.reduce((sum, key) => {
      const items = datasets ? (datasets[key] as DesignationItem[]) : [];
      return sum + (items?.length ?? 0);
    }, 0);
    return baseCounts + additionalCounts > 0;
  }, [result, datasets]);

  const showNoResults = !loading && !error && hasSearched && result !== null && !hasAnyData;

  const renderDesignationSection = (title: string, items: DesignationItem[]) => (
    <section key={title} className="rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      {items.length ? (
        <ul className="mt-3 space-y-2 text-sm text-gray-800">
          {items.map((item) => {
            const displayName = item.name && item.name.trim().length > 0 ? item.name : title;
            const metadata: Array<{ label: string; value: string; isLink?: boolean }> = [];
            if (item.designation) metadata.push({ label: 'Designation', value: item.designation });
            if (item.category) metadata.push({ label: 'Category', value: item.category });
            if (item.reference) metadata.push({ label: 'Reference', value: item.reference });
            if (item.designation_date)
              metadata.push({ label: 'Date', value: item.designation_date });
            if (item.documentation_url) {
              const isUrl = /^https?:\/\//i.test(item.documentation_url);
              metadata.push({
                label: 'Documentation',
                value: item.documentation_url,
                isLink: isUrl
              });
            }
            if (item.notes) {
              metadata.push({ label: 'Notes', value: item.notes });
            }

            return (
              <li key={item.id} className="rounded border border-gray-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-900">{displayName}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600">
                    {item.source} schema
                  </span>
                </div>
                {metadata.length ? (
                  <ul className="mt-2 space-y-1 text-xs text-gray-600">
                    {metadata.map((meta) => (
                      <li key={`${item.id}-${meta.label}`}>
                        <span className="font-medium text-gray-700">{meta.label}:</span>{' '}
                        {meta.isLink ? (
                          <a
                            href={meta.value}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-700 underline"
                          >
                            {meta.value}
                          </a>
                        ) : (
                          meta.value
                        )}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-gray-600">No {title.toLowerCase()} found.</p>
      )}
    </section>
  );

  return (
    <div className={className}>
      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="block text-sm font-medium text-gray-700">
          Address
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Enter a UK site address"
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            aria-label="Site address"
          />
        </label>
        <div>
          <button
            type="submit"
            className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={loading || !address.trim()}
          >
            {loading ? 'Looking up…' : 'Search'}
          </button>
        </div>
      </form>

      {error ? (
        <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          Looking up address data…
        </div>
      ) : null}

      {result ? (
        <div className="mt-6 space-y-4">
          <section className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700">Geocoded location</h3>
            {coordinates ? (
              <div className="mt-2 text-sm text-gray-800">
                {coordinates.display_name ? (
                  <div className="mb-1">{coordinates.display_name}</div>
                ) : null}
                <div className="text-gray-600">lat/lng: {formatLatLng(coordinates.lat, coordinates.lng)}</div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-600">No coordinates returned.</p>
            )}
          </section>

          <section className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700">Conservation areas</h3>
            {datasets?.conservationAreas.length ? (
              <ul className="mt-3 space-y-2 text-sm text-gray-800">
                {datasets.conservationAreas.map((area) => {
                  const displayName = area.name && area.name.trim().length > 0 ? area.name : 'Unnamed area';
                  return (
                    <li key={area.id} className="rounded border border-gray-200 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-gray-900">{displayName}</span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600">
                          {area.source} schema
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-600">
                        {area.lpa ? <span>LPA: {area.lpa}</span> : null}
                        {area.lpa && area.designated_at ? <span className="mx-1">•</span> : null}
                        {area.designated_at ? <span>Designated: {area.designated_at}</span> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-gray-600">No conservation areas found.</p>
            )}
          </section>

          <section className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700">Flood risk zones</h3>
            {datasets?.floodZones.length ? (
              <ul className="mt-3 space-y-2 text-sm text-gray-800">
                {datasets.floodZones.map((zone) => {
                  const displayName =
                    zone.name && zone.name.trim().length > 0 ? zone.name : 'Flood risk zone';
                  return (
                    <li key={zone.id} className="rounded border border-gray-200 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-gray-900">{displayName}</span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600">
                          {zone.source} schema
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-600">
                        {zone.level ? <span>Level: {zone.level}</span> : null}
                        {zone.level && zone.type ? <span className="mx-1">•</span> : null}
                        {zone.type ? <span>Type: {zone.type}</span> : null}
                        {zone.dataset ? (
                          <>
                            {(zone.level || zone.type) ? <span className="mx-1">•</span> : null}
                            <span>Dataset: {zone.dataset}</span>
                          </>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-gray-600">No flood risk zones found.</p>
            )}
          </section>
          {ADDITIONAL_SECTIONS.map(({ key, title }) => {
            const items: DesignationItem[] = datasets ? (datasets[key] as DesignationItem[]) : [];
            return items.length ? renderDesignationSection(title, items) : null;
          })}
        </div>
      ) : null}

      {showNoResults ? (
        <div className="mt-4 rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          No designations were located for this address.
        </div>
      ) : null}
    </div>
  );
}
