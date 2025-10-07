import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
  const pageSize = Math.max(1, Number(url.searchParams.get('pageSize') || '50'));
  const activeOnlyParam = (url.searchParams.get('activeOnly') || 'false').toLowerCase();
  const activeOnly = activeOnlyParam === 'true' || activeOnlyParam === '1';

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = supabaseServer();
  try {
    let query = supabase
      .from('local_planning_authorities')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })
      .range(from, to);

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error, count } = await query;
    if (error) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return NextResponse.json(
      {
        data: data ?? [],
        pagination: { page, pageSize, total, totalPages }
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}


