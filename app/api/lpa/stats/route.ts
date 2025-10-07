export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase/server';

export async function GET(_req: NextRequest) {
  const supabase = supabaseServer();
  try {
    const { data, error } = await supabase.rpc('get_lpa_stats');
    if (error) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    const row = Array.isArray(data) ? data[0] ?? {} : data ?? {};
    return NextResponse.json(row, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}


