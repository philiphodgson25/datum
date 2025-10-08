import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase/server';
import { lpaLookupRequestSchema, lpaLookupResponseSchema } from '../../../../lib/schemas/lpa';
import { LpaLookupError, performLpaLookup } from '../../../../lib/services/lpa-lookup';
import { env, publicEnv } from '../../../../lib/env';

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
    const result = await performLpaLookup(parsedBody.data.address, {
      supabase,
      nominatimUserAgent: env.NOMINATIM_USER_AGENT,
      referer: publicEnv.NEXT_PUBLIC_APP_URL
    });

    const responseBody = lpaLookupResponseSchema.parse(result);
    return NextResponse.json(responseBody, { status: 200, headers: noCacheHeaders });
  } catch (error) {
    if (error instanceof LpaLookupError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: noCacheHeaders });
    }
    console.error('Unexpected lookup error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: noCacheHeaders });
  }
}
