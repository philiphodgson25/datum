// app/api/lpa/lookup/route.ts
// Geocode an address (Nominatim) then find the LPA via PostGIS RPC.
// Notes:
// - Nominatim requires a valid, identifying User-Agent OR Referer.
// - We defensively handle non-JSON responses (e.g. HTML error pages / 403 / 429).
// - Uses the anon Supabase server client.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase/server';

export const dynamic = 'force-dynamic'; // avoid static caching for this route

type GeocodeHit = {
  lat: string;
  lon: string;
  display_name: string;
};

async function fetchJSON(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const contentType = res.headers.get('content-type') || '';

  // If not JSON, read the text body to expose the upstream error cleanly.
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(
      `Upstream returned non-JSON (status ${res.status} ${res.statusText}). Body starts: ${text.slice(
        0,
        200
      )}`
    );
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Upstream error ${res.status} ${res.statusText} — ${body.slice(0, 200)}`
    );
  }

  return res.json();
}

async function geocodeAddress(address: string) {
  const base = 'https://nominatim.openstreetmap.org/search';
  const qs = new URLSearchParams({
    q: address,
    format: 'jsonv2',
    limit: '1',
    addressdetails: '1',
    countrycodes: 'gb',
  });

  // Nominatim usage policy: send a proper UA/Referer that identifies your app.
  // https://operations.osmfoundation.org/policies/nominatim/
  const headers: HeadersInit = {
    'User-Agent':
      process.env.NOMINATIM_USER_AGENT ||
      'LatentMade-PlanningApp/1.0 (phil@latentmade.com)',
    Accept: 'application/json',
    // A Referer also helps with acceptance:
    Referer:
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3030',
  };

  const data = (await fetchJSON(`${base}?${qs.toString()}`, {
    headers,
    // Don't cache geocoding responses; we want fresh results during dev.
    cache: 'no-store',
  })) as GeocodeHit[];

  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const hit = data[0];
  return {
    lat: parseFloat(hit.lat),
    lng: parseFloat(hit.lon),
    display_name: hit.display_name,
  };
}

export async function POST(request: NextRequest) {
  // Ensure this route never gets cached by proxies/browsers.
  const noCacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  } as const;

  try {
    const body = await request.json().catch(() => ({}));
    const address = (body as any)?.address;
    if (typeof address !== 'string' || address.trim().length === 0) {
      return NextResponse.json(
        { error: 'Address required' },
        { status: 400, headers: noCacheHeaders }
      );
    }

    // 1) Geocode
    const coords = await geocodeAddress(address);
    if (!coords) {
      return NextResponse.json(
        { error: 'Address not found or could not be geocoded' },
        { status: 404, headers: noCacheHeaders }
      );
    }

    // 2) LPA lookup via RPC
    const supabase = supabaseServer();
    const { data, error } = await supabase.rpc('get_lpa_by_point', {
      lat: coords.lat,
      lng: coords.lng,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Database query failed' },
        { status: 500, headers: noCacheHeaders }
      );
    }

    const lpa = Array.isArray(data) ? data[0] ?? null : data ?? null;

    return NextResponse.json(
      {
        coordinates: {
          lat: coords.lat,
          lng: coords.lng,
          display_name: coords.display_name,
        },
        lpa,
      },
      { status: 200, headers: noCacheHeaders }
    );
  } catch (err: any) {
    // Surface a clearer error if upstream returned HTML / policy block.
    const msg =
      typeof err?.message === 'string'
        ? err.message
        : 'Internal server error';
    return NextResponse.json(
      { error: msg },
      { status: 502, headers: noCacheHeaders }
    );
  }
}