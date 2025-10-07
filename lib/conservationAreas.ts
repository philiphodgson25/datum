import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getConservationAreasByLpa(lpaCode: string) {
  const { data, error } = await supabase.rpc('get_conservation_areas_by_lpa_geojson', { p_lpa: lpaCode });
  if (error) throw error;
  return data;
}

export async function getConservationAreasAtPoint(lon: number, lat: number) {
  const { data, error } = await supabase.rpc('get_conservation_areas_at_point_geojson', {
    p_lon: lon,
    p_lat: lat
  });
  if (error) throw error;
  return data;
}

export function toGeoJSON(rows: any[]) {
  return {
    type: 'FeatureCollection',
    features: rows.map((r: any) => ({
      type: 'Feature',
      properties: {
        id: r.id,
        name: r.name,
        lpa_code: r.lpa_code,
        designated_date: r.designated_date,
        article4: r.article4,
        source: r.source
      },
      geometry: r.geom
    }))
  } as const;
}

