import { type SupabaseClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import { lpaLookupResponseSchema, lpaRecordSchema, type LpaLookupResponse } from '../schemas/lpa';

export class LpaLookupError extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'LpaLookupError';
    this.status = status;
  }
}

type FetchImpl = typeof fetch;

type SupabaseLike = Pick<SupabaseClient, 'rpc'>;

type LookupDeps = {
  supabase: SupabaseLike;
  fetchImpl?: FetchImpl;
  nominatimUserAgent?: string;
  referer?: string;
  databaseUrl?: string;
};

const DEFAULT_HEADERS = {
  Accept: 'application/json'
} as const;

type FetchRequestInfo = globalThis.RequestInfo | URL;
type FetchRequestInit = globalThis.RequestInit;
type FetchHeadersInit = globalThis.HeadersInit;

async function fetchJSON<T>(input: FetchRequestInfo, init: FetchRequestInit, fetchImpl: FetchImpl): Promise<T> {
  const response = await fetchImpl(input, init);
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    const text = await response.text();
    throw new LpaLookupError(
      `Geocoder returned non-JSON response (${response.status} ${response.statusText}): ${text.slice(0, 200)}`,
      502
    );
  }

  if (!response.ok) {
    const body = await response.text();
    throw new LpaLookupError(
      `Geocoder error ${response.status} ${response.statusText}: ${body.slice(0, 200)}`,
      response.status === 404 ? 404 : 502
    );
  }

  return (await response.json()) as T;
}

type GeocodeHit = {
  lat: string;
  lon: string;
  display_name?: string;
};

async function geocodeAddress(address: string, deps: LookupDeps): Promise<{ lat: number; lng: number; display_name?: string }> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const qs = new URLSearchParams({
    q: address,
    format: 'jsonv2',
    limit: '1',
    addressdetails: '1',
    countrycodes: 'gb'
  });

  const headers: FetchHeadersInit = {
    ...DEFAULT_HEADERS,
    'User-Agent': deps.nominatimUserAgent ?? 'LatentMade-PlanningApp/1.0 (support@latentmade.com)'
  };
  if (deps.referer) headers.Referer = deps.referer;

  const results = await fetchJSON<GeocodeHit[]>(
    `https://nominatim.openstreetmap.org/search?${qs.toString()}`,
    {
      headers,
      cache: 'no-store'
    },
    fetchImpl
  );

  const first = Array.isArray(results) ? results[0] : null;
  if (!first) {
    throw new LpaLookupError('Address not found or could not be geocoded', 404);
  }

  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new LpaLookupError('Geocoder returned invalid coordinates', 502);
  }

  return {
    lat,
    lng,
    display_name: first.display_name
  };
}

export async function lookupLpaByPoint(
  lat: number,
  lng: number,
  deps: LookupDeps
): Promise<LpaLookupResponse> {
  const { data, error } = await deps.supabase.rpc('get_lpa_by_point', { lat, lng });
  if (error) {
    const fallback = deps.databaseUrl ? await lookupLpaByPointViaSql(lat, lng, deps.databaseUrl) : undefined;
    if (fallback !== undefined) {
      return lpaLookupResponseSchema.parse({
        coordinates: { lat, lng },
        lpa: fallback
      });
    }
    throw new LpaLookupError('Database query failed', 500);
  }

  const record = Array.isArray(data) ? data[0] ?? null : data ?? null;
  const parsedRecord = record ? lpaRecordSchema.parse(record) : null;

  if (!parsedRecord && deps.databaseUrl) {
    const fallback = await lookupLpaByPointViaSql(lat, lng, deps.databaseUrl);
    if (fallback !== undefined) {
      return lpaLookupResponseSchema.parse({
        coordinates: { lat, lng },
        lpa: fallback
      });
    }
  }

  return lpaLookupResponseSchema.parse({
    coordinates: { lat, lng },
    lpa: parsedRecord
  });
}

export async function performLpaLookup(address: string, deps: LookupDeps): Promise<LpaLookupResponse> {
  const coords = await geocodeAddress(address, deps);
  const result = await lookupLpaByPoint(coords.lat, coords.lng, deps);
  return lpaLookupResponseSchema.parse({
    ...result,
    coordinates: {
      ...result.coordinates,
      display_name: coords.display_name
    }
  });
}

async function lookupLpaByPointViaSql(lat: number, lng: number, databaseUrl: string): Promise<ReturnType<typeof lpaRecordSchema.parse> | null> {
  if (!databaseUrl) {
    return null;
  }

  const sql = postgres(databaseUrl, {
    ssl: 'require',
    prepare: false
  });

  try {
    const appRows = await sql<Record<string, any>>`
      select
        id::text as id,
        entity,
        reference,
        name,
        is_active,
        ST_AsGeoJSON(centroid)::json as centroid,
        ST_AsGeoJSON(boundary)::json as boundary
      from app.local_planning_authority_public
      where boundary is not null
        and st_intersects(
          boundary,
          ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)
        )
      order by valid_to is null desc, valid_to asc nulls first
      limit 1
    `;

    if (appRows.length > 0) {
      return lpaRecordSchema.parse(appRows[0]);
    }

    const coreRows = await sql<Record<string, any>>`
      select
        id::text as id,
        entity,
        reference,
        name,
        is_active,
        ST_AsGeoJSON(centroid)::json as centroid,
        ST_AsGeoJSON(boundary)::json as boundary
      from core.local_planning_authority_core
      where boundary is not null
        and st_intersects(
          boundary,
          ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)
        )
      order by valid_to is null desc, valid_to asc nulls first
      limit 1
    `;

    if (coreRows.length > 0) {
      return lpaRecordSchema.parse(coreRows[0]);
    }

    return null;
  } finally {
    await sql.end({ timeout: 5 });
  }
}
