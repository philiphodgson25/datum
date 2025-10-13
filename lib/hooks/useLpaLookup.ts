'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { z } from 'zod';
import {
  coordinatesSchema,
  lpaByPointRequestSchema,
  lpaLookupRequestSchema,
  lpaLookupResponseSchema,
  type LpaLookupResponse
} from '../schemas/lpa';

type Stats = {
  total_lpas: number;
  active_lpas: number;
  historical_lpas: number;
  with_boundaries: number;
} | null;

type UseLpaLookup = {
  lookupByAddress: (_address: string) => Promise<void>;
  lookupByPoint: (_lat: number, _lng: number) => Promise<void>;
  stats: Stats;
  statsLoading: boolean;
  statsError: string | null;
  loading: boolean;
  error: string | null;
  data: LpaLookupResponse | null;
  clear: () => void;
  debounce: <T extends (..._args: any[]) => void>(_fn: T, _wait?: number) => T;
};

type FetchRequestInit = globalThis.RequestInit;

async function fetchJson(url: string, init?: FetchRequestInit) {
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

async function fetchWithSchema<T>(schema: z.ZodSchema<T>, url: string, init: FetchRequestInit): Promise<T> {
  const res = await fetch(url, init);
  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const message =
      (payload && typeof payload === 'object' && payload !== null && 'error' in payload && typeof (payload as any).error === 'string'
        ? (payload as any).error
        : null) || `Request failed with ${res.status}`;
    throw new Error(message);
  }

  try {
    return schema.parse(payload);
  } catch (err) {
    throw new Error('Invalid response payload');
  }
}

export function useLpaLookup(): UseLpaLookup {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LpaLookupResponse | null>(null);
  const [stats, setStats] = useState<Stats>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const json = await fetchJson('/api/lpa/stats', { method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include' });
      setStats({
        total_lpas: Number(json.total_lpas ?? 0),
        active_lpas: Number(json.active_lpas ?? 0),
        historical_lpas: Number(json.historical_lpas ?? 0),
        with_boundaries: Number(json.with_boundaries ?? 0)
      });
    } catch (err: any) {
      setStatsError(err?.message || 'Failed to load stats');
      setStats(null);
      // eslint-disable-next-line no-console
      console.warn('Failed to fetch LPA stats', err);
    } finally {
      setStatsLoading(false);
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
    const validation = lpaLookupRequestSchema.safeParse({ address });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? 'Invalid address');
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchWithSchema(
        lpaLookupResponseSchema,
        '/api/lpa/lookup',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validation.data),
          credentials: 'include'
        }
      );
      setData(result);
    } catch (err) {
      setError((err as Error).message || 'Lookup failed');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const lookupByPoint = useCallback(async (lat: number, lng: number) => {
    const validation = lpaByPointRequestSchema.safeParse({ lat, lng });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? 'Invalid coordinates');
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchWithSchema(
        lpaLookupResponseSchema,
        '/api/lpa/by-point',
        {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
        credentials: 'include'
        }
      );
      setData({
        ...result,
        coordinates: coordinatesSchema.parse({
          ...result.coordinates,
          lat,
          lng
        })
      });
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

  const debounce = useCallback(<T extends (..._callArgs: any[]) => void>(fn: T, wait = 300) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const debounced = ((..._callArgs: Parameters<T>) => {
      const callArgs = _callArgs;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        fn(...callArgs);
      }, wait);
    }) as T;
    return debounced;
  }, []);

  return useMemo(
    () => ({ lookupByAddress, lookupByPoint, stats, statsLoading, statsError, loading, error, data, clear, debounce }),
    [lookupByAddress, lookupByPoint, stats, statsLoading, statsError, loading, error, data, clear, debounce]
  );
}
