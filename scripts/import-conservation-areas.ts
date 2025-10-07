import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

type Feature = {
  id?: string;
  properties: Record<string, any>;
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: any };
};

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const FILE = process.env.CA_FILE || 'data/Conservation_Areas_-5052013531654473760.geojson';

const SOURCE = 'historic-england';

function toMultiPolygon(g: Feature['geometry']) {
  if (!g) return null;
  if (g.type === 'MultiPolygon') return g;
  if (g.type === 'Polygon') return { type: 'MultiPolygon', coordinates: [g.coordinates] };
  return null;
}

async function upsertWithRetry(
  supabase: ReturnType<typeof createClient>,
  rows: any[]
): Promise<void> {
  if (rows.length === 0) return;

  const { error } = await supabase.rpc('upsert_conservation_areas', { batch: rows });
  if (!error) return;

  const message = (error as any)?.message || '';
  const code = (error as any)?.code || '';
  const isTimeout = code === '57014' || /statement timeout/i.test(message);

  if (isTimeout && rows.length > 1) {
    const mid = Math.floor(rows.length / 2);
    const left = rows.slice(0, mid);
    const right = rows.slice(mid);
    // small pause to avoid thrashing
    await new Promise((r) => setTimeout(r, 100));
    await upsertWithRetry(supabase, left);
    await upsertWithRetry(supabase, right);
    return;
  }

  throw error;
}

(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const text = fs.readFileSync(path.resolve(FILE), 'utf8');
  const geo = JSON.parse(text);

  const features: Feature[] = geo.features ?? [];
  const rows = features.map((f) => {
    const mp = toMultiPolygon(f.geometry);
    if (!mp) return null;

    const p = f.properties || {};
    return {
      external_id: f.id ?? p.id ?? null,
      name: p.name ?? p.Name ?? 'Conservation Area',
      lpa_code: p.lpa_code ?? p.local_authority_code ?? p.lpa ?? null,
      designated_date: p.designated_date ?? p.DesignationDate ?? null,
      article4: (p.article4 ?? p.Article4 ?? false),
      article4_notes: p.article4_notes ?? p.Article4Notes ?? null,
      source: SOURCE,
      source_url: p.source_url ?? p.Source ?? null,
      last_updated: p.last_updated ?? p.LastUpdate ?? null,
      geom: mp,
    };
  }).filter(Boolean);

  // start with 400, adaptive split will handle timeouts automatically
  const chunkSize = 400;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    await upsertWithRetry(supabase, chunk);
    console.log(`Upserted ${Math.min(i + chunk.length, rows.length)} / ${rows.length}`);
  }

  console.log('Import complete.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});