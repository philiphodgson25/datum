import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase/server';
import { lpaByPointRequestSchema, lpaLookupResponseSchema } from '../../../../lib/schemas/lpa';
import { LpaLookupError, lookupLpaByPoint } from '../../../../lib/services/lpa-lookup';

export const dynamic = 'force-dynamic';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0'
} as const;

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}));
    const parsed = lpaByPointRequestSchema.safeParse(payload);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid request body';
      return NextResponse.json({ error: message }, { status: 400, headers: noCacheHeaders });
    }

    const supabase = supabaseServer();
    const result = await lookupLpaByPoint(parsed.data.lat, parsed.data.lng, { supabase });
    const responseBody = lpaLookupResponseSchema.parse(result);

    return NextResponse.json(responseBody, { status: 200, headers: noCacheHeaders });
  } catch (error) {
    if (error instanceof LpaLookupError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: noCacheHeaders });
    }
    console.error('Unexpected by-point error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: noCacheHeaders });
  }
}

