'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type Coordinates = { lat: number; lng: number };

export type LPA = {
  id: string;
  entity: string;
  reference: string;
  name: string;
  is_active: boolean;
  centroid: any;
  boundary: any;
};

type LookupData = { coordinates?: Coordinates; lpa?: LPA } | null;

type Stats = {
  total_lpas: number;
  active_lpas: number;
  historical_lpas: number;
  with_boundaries: number;
} | null;

type UseLpaLookup = {
  lookupByAddress: (address: string) => Promise<void>;
  lookupByPoint: (lat: number, lng: number) => Promise<void>;
  stats: Stats;
  loading: boolean;
  error: string | null;
  data: LookupData;
  clear: () => void;
  debounce: <T extends (...args: any[]) => void>(fn: T, wait?: number) => T;
};

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // ignore parse error; json stays null
  }
  if (!res.ok) {
    const message = (json && (json.message || json.error)) || `Request failed with ${res.status}`;
    throw new Error(message);
  }
  return json ?? {};
}

export function useLpaLookup(): UseLpaLookup {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LookupData>(null);
  const [stats, setStats] = useState<Stats>(null);

  const fetchStats = useCallback(async () => {
    try {
      const json = await fetchJson('/api/lpa/stats', { method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include' });
      setStats({
        total_lpas: Number(json.total_lpas ?? 0),
        active_lpas: Number(json.active_lpas ?? 0),
        historical_lpas: Number(json.historical_lpas ?? 0),
        with_boundaries: Number(json.with_boundaries ?? 0)
      });
    } catch (err) {
      // keep stats null on error; do not surface as UI error
      // eslint-disable-next-line no-console
      console.warn('Failed to fetch LPA stats', err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const lookupByAddress = useCallback(async (address: string) => {
    if (!address || !address.trim()) {
      setError('Please enter an address');
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const json = await fetchJson('/api/lpa/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
        credentials: 'include'
      });
      setData({
        coordinates: json.coordinates ?? undefined,
        lpa: json.lpa ?? undefined
      });
    } catch (err) {
      setError((err as Error).message || 'Lookup failed');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const lookupByPoint = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    try {
      const json = await fetchJson('/api/lpa/by-point', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
        credentials: 'include'
      });
      setData({ coordinates: { lat, lng }, lpa: json.lpa ?? undefined });
    } catch (err) {
      setError((err as Error).message || 'Lookup failed');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setError(null);
    setData(null);
  }, []);

  const debounce = useCallback(<T extends (...args: any[]) => void>(fn: T, wait = 300) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const debounced = ((...args: any[]) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        fn(...args);
      }, wait);
    }) as T;
    return debounced;
  }, []);

  return useMemo(
    () => ({ lookupByAddress, lookupByPoint, stats, loading, error, data, clear, debounce }),
    [lookupByAddress, lookupByPoint, stats, loading, error, data, clear, debounce]
  );
}


