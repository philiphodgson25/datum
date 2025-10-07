import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase/server';

type Body = { address?: unknown };

export async function POST(req: NextRequest) {
  let body: Body = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const address = String((body as any)?.address || '').trim();
  if (!address) {
    return NextResponse.json({ error: 'address is required' }, { status: 400 });
  }

  // Geocode using Nominatim
  const params = new URLSearchParams({ q: address, format: 'json', limit: '1', countrycodes: 'gb' });
  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'latentmade-lpa-lookup/1.0 (phil@latentmade.com)'
    }
  });
  if (!res.ok) {
    return NextResponse.json({ error: `Geocode failed: ${res.status}` }, { status: 502 });
  }
  const geo: any[] = await res.json().catch(() => []);
  const first = geo[0];
  if (!first) {
    return NextResponse.json({ error: 'Address not found' }, { status: 404 });
  }

  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'Geocode returned invalid coordinates' }, { status: 502 });
  }

  const supabase = supabaseServer();
  try {
    const { data, error } = await supabase.rpc('get_lpa_by_point', { lat, lng });
    if (error) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    const row = Array.isArray(data) ? data[0] ?? null : data ?? null;
    return NextResponse.json(
      {
        coordinates: { lat, lng, display_name: first.display_name },
        lpa: row ?? null
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}


