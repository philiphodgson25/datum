import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase/server';
import { lpaLookupRequestSchema } from '../../../../lib/schemas/lpa';
import { LpaLookupError, performLpaLookup } from '../../../../lib/services/lpa-lookup';
import { fetchAddressDatasets } from '../../../../lib/services/address-context';
import { addressLookupResponseSchema } from '../../../../lib/schemas/address';
import { env, publicEnv } from '../../../../lib/env';

export const dynamic = 'force-dynamic';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0'
} as const;

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}));
    const parsedBody = lpaLookupRequestSchema.safeParse(json);
    if (!parsedBody.success) {
      const message = parsedBody.error.issues[0]?.message ?? 'Invalid request body';
      return NextResponse.json({ error: message }, { status: 400, headers: noCacheHeaders });
    }

    const supabase = supabaseServer();
    const lookup = await performLpaLookup(parsedBody.data.address, {
      supabase,
      nominatimUserAgent: env.NOMINATIM_USER_AGENT,
      referer: publicEnv.NEXT_PUBLIC_APP_URL,
      databaseUrl: env.DATABASE_URL
    });

    if (!env.DATABASE_URL || env.DATABASE_URL.trim().length === 0) {
      return NextResponse.json(
        { error: 'Server not configured with DATABASE_URL; cannot load datasets.' },
        { status: 500, headers: noCacheHeaders }
      );
    }

    const datasets = await fetchAddressDatasets(lookup.coordinates.lat, lookup.coordinates.lng, env.DATABASE_URL);

    const responseBody = addressLookupResponseSchema.parse({
      coordinates: lookup.coordinates,
      lpa: lookup.lpa,
      datasets
    });

    return NextResponse.json(responseBody, { status: 200, headers: noCacheHeaders });
  } catch (error) {
    if (error instanceof LpaLookupError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: noCacheHeaders });
    }
    console.error('Address lookup error', error);
    return NextResponse.json({ error: 'Unable to complete address lookup' }, { status: 500, headers: noCacheHeaders });
  }
}
