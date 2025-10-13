export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { env } from '../../../../lib/env';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0'
} as const;

type StatRow = {
  total_lpas: number;
  active_lpas: number;
  historical_lpas: number;
  with_boundaries: number;
};

function normaliseRow(input: Record<string, unknown> | null | undefined): StatRow | null {
  if (!input) return null;

  const toNumber = (value: unknown): number => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'bigint') return Number(value);
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  return {
    total_lpas: toNumber(input.total_lpas),
    active_lpas: toNumber(input.active_lpas),
    historical_lpas: toNumber(input.historical_lpas),
    with_boundaries: toNumber(input.with_boundaries)
  };
}

async function runStatsQuery(sql: ReturnType<typeof postgres>, table: 'app' | 'core'): Promise<StatRow | null> {
  const qualifiedTable =
    table === 'app' ? 'app.local_planning_authority_public' : 'core.local_planning_authority_core';

  try {
    const rows = await sql.unsafe<{
      total_lpas: unknown;
      active_lpas: unknown;
      historical_lpas: unknown;
      with_boundaries: unknown;
    }>(`
      select
        count(*)::bigint as total_lpas,
        count(*) filter (where is_active is true)::bigint as active_lpas,
        count(*) filter (where is_active is false)::bigint as historical_lpas,
        count(*) filter (where boundary is not null)::bigint as with_boundaries
      from ${qualifiedTable}
    `);
    return normaliseRow(rows[0] ?? null);
  } catch (error: any) {
    if (error && typeof error === 'object' && error.code === '42P01') {
      // Table/view does not exist in this schema – fall back to the other.
      return null;
    }
    throw error;
  }
}

async function fetchLpaStats(databaseUrl: string): Promise<StatRow> {
  const sql = postgres(databaseUrl, {
    ssl: 'require',
    prepare: false
  });

  try {
    const appStats = await runStatsQuery(sql, 'app');
    if (appStats && appStats.total_lpas > 0) {
      return appStats;
    }

    const coreStats = await runStatsQuery(sql, 'core');
    if (coreStats) {
      return coreStats;
    }

    // No data in either schema; fall back to zeros.
    return (
      appStats ?? {
        total_lpas: 0,
        active_lpas: 0,
        historical_lpas: 0,
        with_boundaries: 0
      }
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export async function GET() {
  if (!env.DATABASE_URL || env.DATABASE_URL.trim().length === 0) {
    return NextResponse.json(
      { error: 'Server misconfigured: DATABASE_URL not set.' },
      { status: 500, headers: noCacheHeaders }
    );
  }

  try {
    const stats = await fetchLpaStats(env.DATABASE_URL);
    return NextResponse.json(stats, { status: 200, headers: noCacheHeaders });
  } catch (error) {
    console.error('Failed to fetch LPA stats', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500, headers: noCacheHeaders });
  }
}

