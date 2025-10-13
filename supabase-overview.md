# Supabase Overview

Last updated: 8 October 2025

This project is linked to Supabase and the CLI + MCP integration are available for day-to-day operations.

- Project ref: `qctufkktnkxnipmuglcq`

## CLI

```bash
# Check CLI is installed
supabase --version

# Help
supabase --help

# Link project (one-time per repo folder; already linked)
supabase link --project-ref qctufkktnkxnipmuglcq

# Push migrations to the cloud project (IPv4-friendly pooler URL)
supabase db push --db-url 'postgresql://postgres.<project_ref>:<PASSWORD>@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require'

# Optional: local stack for local dev
supabase start
supabase stop
```

Notes:
- Linking is one-time per repo folder; no need to re-link daily.
- Use the IPv4-friendly pooler URL when behind restrictive networks/firewalls.
- Keep credentials in `.env.local` or your shell session; never commit secrets.

## MCP (Supabase)

The Supabase MCP (Model Context Protocol) integration is connected in Cursor. It allows you to:
- Inspect logs (API, Postgres, auth, storage, etc.)
- Execute SQL and apply migrations
- Manage branches (create, merge, reset, rebase)

Use the CLI for long-running operations; use MCP for quick checks and automation from the IDE.

🧱 Supabase Project Overview (Updated)

Date: 2025‑10‑08
Owner: Philip
Scope: Planning datasets (e.g., local planning authorities, conservation areas, flood risk zones) powering address lookups and map overlays.

⸻

🎯 Purpose & Use‑Cases

Primary purpose: Supabase is the backend database + API for designation‑type spatial data and related services.

Use‑case A — Address → “what applies here?”
Input is an address or point → return applicable designations (e.g., Flood Zone 2/3, conservation area). Requires fast point‑in‑polygon queries.

Use‑case B — Toggle → show map overlay
User toggles a layer (e.g., Flood Risk) → overlay renders quickly at any zoom. Requires efficient, cached vector tiles (not live DB queries per pan/zoom).

⸻

🧩 Architecture (Schemas & Flow)

Schema	Purpose	Typical Contents
stg	Landing zone for raw imports	*_raw tables loaded from GeoJSON/CSV/GPkg
core	Cleaned, validated, authoritative	Spatial tables with PostGIS geometry, standard columns, indexes
app	Read‑only views & RPCs for clients	Slim views, public API shape, functions (PIP lookups)
ref	Reference lookups	Code lists, name mappings, boundaries used across datasets
ops	Operational logging & meta	Import logs, ETL runs, data versions

Spatial standards
	•	All geometries in EPSG:4326.
	•	Geometry column name: geom geometry(<type>, 4326).
	•	GiST indexes for spatial search; use ST_Subdivide on complex geometries when needed.

ETL pattern
	1.	Import to stg.*
	2.	Transform/clean → core.* (valid geometry, normalized attributes, IDs)
	3.	Publish minimal app.* views + RPCs
	4.	Log runs in ops.import_log

⸻

Datasets follow a strict naming convention across schemas: _raw for raw source imports in stg, _core for cleaned canonical tables in core, and _public for frontend-facing views in app.

⸻

🌐 Connectivity (IPv4/IPv6) — Important
	•	Supabase Direct connection hosts (db.<project_ref>.supabase.co:5432) are IPv6 by default.
	•	On IPv4‑only networks/environments, use the Pooler hosts (Session or Transaction):
aws-<region>.pooler.supabase.com (ports 5432 or 6543) — IPv4‑compatible.
	•	If direct IPv4 is required, there is an IPv4 add‑on (optional). Otherwise, keep using the pooler for psql, ogr2ogr, and app connections.

Examples
	•	psql "postgresql://postgres.<project_ref>:<PASSWORD>@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require"
	•	ogr2ogr -f PostgreSQL "PG:host=aws-1-eu-west-1.pooler.supabase.com port=5432 dbname=postgres user=postgres.<project_ref> password=<PASSWORD> sslmode=require" ...

⸻

📥 Ingestion — Geospatial Data (EA Flood Zones et al.)

Primary path (stable): ogr2ogr → stg.* over the Pooler
	•	Force WGS84 and multi‑geometry on import:

ogr2ogr -overwrite -f PostgreSQL \
"PG:host=aws-1-eu-west-1.pooler.supabase.com port=5432 dbname=postgres user=postgres.<project_ref> password=<PASSWORD> sslmode=require" \
/path/to/flood-risk-zone.geojson \
-nln stg.flood_risk_zones_raw \
-lco GEOMETRY_NAME=geom \
-nlt PROMOTE_TO_MULTI \
-t_srs EPSG:4326 \
-dim XY \
--config PG_USE_COPY YES \
-gt 50000      # commit every 50k features (tune as needed)



Alternate ingestion (optional): CSV + COPY
Convert GeoJSON → CSV with WKT, COPY into staging, then cast WKT → geometry. Use when you need absolute throughput or to avoid long single transactions.

⸻

🔧 Transform → core.*

Geometry hygiene & normalization template (adapt fields as needed):

create table if not exists core.flood_risk_zones (
  id bigserial primary key,
  src text not null default 'EA Flood Map for Planning',
  src_id text,
  zone_code text,
  zone_name text,
  imported_at timestamptz not null default now(),
  geom geometry(MultiPolygon,4326) not null
);

-- optional: replace on full refresh
-- truncate core.flood_risk_zones;

with s as (
  select *,
         coalesce(nullif("Zone", ''), nullif(zone, ''), nullif(fz, ''), nullif(flood_zone, '')) as raw_zone
  from stg.flood_risk_zones_raw
),
norm as (
  select case
           when raw_zone ilike '%3b%' then 'FZ3b'
           when raw_zone ilike '%3a%' then 'FZ3a'
           when raw_zone ilike '%3%'  then 'FZ3'
           when raw_zone ilike '%2%'  then 'FZ2'
           else null
         end as zone_code,
         coalesce(raw_zone, 'Unknown') as zone_name,
         coalesce(cast(objectid as text), cast(gid as text), cast(id as text)) as src_id,
         st_multi(st_collectionextract(st_makevalid(geom), 3)) as geom
  from s where geom is not null
)
insert into core.flood_risk_zones (src, src_id, zone_code, zone_name, geom)
select 'EA Flood Map for Planning', src_id, zone_code, zone_name, geom from norm;

create index if not exists idx_core_flood_risk_zones_geom
  on core.flood_risk_zones using gist(geom);

insert into ops.import_log (source_name, target_table, row_count, status, notes)
select 'ea_flood_zones', 'core.flood_risk_zones', count(*), 'ok', 'stg→core'
from core.flood_risk_zones;

Performance tips
	•	For very complex polygons, consider pre‑processing with ST_Subdivide(geom, <target_area>) and storing the result in a materialized table used for PIP.

⸻

🧪 Publish to app.* (Views + RPCs)

View for API consumption

create or replace view app.flood_risk_zones as
select id, zone_code, zone_name, geom
from core.flood_risk_zones;

RPC: point‑in‑polygon lookup (Use‑case A)

create or replace function app.get_flood_risk_at_point(lon double precision, lat double precision)
returns table(id bigint, zone_code text, zone_name text)
language sql stable security definer as $$
  select id, zone_code, zone_name
  from core.flood_risk_zones
  where st_contains(geom, st_setsrid(st_point(lon, lat),4326));
$$;

Permissions

grant usage on schema app to anon, authenticated;
grant select on app.flood_risk_zones to anon, authenticated;
grant execute on function app.get_flood_risk_at_point(double precision,double precision) to anon, authenticated;

Data API settings
	•	Add app to Exposed schemas so the Data API/clients can call the view + RPC directly.
	•	Keep Max rows default; PIP returns few rows.

⸻

🗺️ Map Overlays (Use‑case B) — Hybrid path

Why: Don’t query DB on every pan/zoom. Serve static vector tiles (cheap/fast), and reserve DB for PIP/metadata.

Tile generation (Tippecanoe → MBTiles)

# install tippecanoe (macOS): brew install tippecanoe

tippecanoe \
  -o flood_risk.mbtiles \
  -l flood_risk \
  -Z 6 -z 14 \
  --drop-densest-as-needed --extend-zooms-if-still-dropping \
  --coalesce --coalesce-densest --detect-shared-borders \
  flood-risk-zone.geojson

Convert to PMTiles (optional but recommended for CDN hosting)

# install pmtiles CLI: npm i -g @protomaps/pmtiles
pmtiles convert flood_risk.mbtiles flood_risk.pmtiles

Host
	•	Upload flood_risk.pmtiles to a public bucket (Supabase Storage, or any CDN/HTTP static host).

MapLibre wiring (client)

import maplibregl from 'maplibre-gl'
import * as pmtiles from 'pmtiles'  // registers protocol

const protocol = new pmtiles.Protocol()
maplibregl.addProtocol('pmtiles', protocol.tile)

const map = new maplibregl.Map({
  container: 'map', style: 'https://demotiles.maplibre.org/style.json', center: [-2.36, 51.38], zoom: 11
})

map.on('load', () => {
  map.addSource('flood', {
    type: 'vector',
    url: 'pmtiles://https://<your-host>/flood_risk.pmtiles',
    minzoom: 0, maxzoom: 14
  })
  map.addLayer({
    id: 'flood-fill', type: 'fill', source: 'flood', 'source-layer': 'flood_risk',
    paint: { 'fill-opacity': 0.35 }
  })
  map.addLayer({ id: 'flood-outline', type: 'line', source: 'flood', 'source-layer': 'flood_risk' })
})


⸻

🔐 Security & RLS
	•	Prefer views in app.* and stable RPCs with security definer.
	•	Grant select/execute only on what the client needs. Keep raw core.* tables private.
	•	If exposing public via Data API, consider removing or narrowing if not required; add app instead.

⸻

🛠️ Ops & Monitoring
	•	ops.import_log captures ETL runs (source, target table, counts, notes).
	•	Consider a lightweight refresh script to re‑ingest staging and rebuild tiles on a schedule when EA releases updates.
	•	Keep Migration scripts idempotent (safe to re‑run).

⸻

🧹 De‑scope / Remove (if present)
	•	Direct IPv6 host steps for ingest on IPv4 networks — replace with Pooler connection examples.
	•	Bulk import via Data API for large GeoJSON (slow/rate‑limited) — prefer ogr2ogr/COPY.
	•	Any legacy references to missing staging tables (e.g., stg.conservation_areas_raw errors) — align to current table names (stg.flood_risk_zones_raw, etc.).

⸻

🗒️ Changelog (2025‑10‑08)
	•	Added IPv4/IPv6 connectivity guidance (Pooler vs Direct).
	•	Documented Hybrid route: PostGIS for PIP + static vector tiles for maps.
	•	Captured Use‑cases A/B and their implications.
	•	Added ingestion templates (ogr2ogr over pooler) and transform SQL.
	•	Recommended exposing app schema via Data API (views + RPCs only).
	•	Clarified removal of Data API bulk import guidance and IPv6‑only assumptions.

⸻

✅ Summary
	•	PostGIS powers accurate, fast PIP queries for address lookups.
	•	Static vector tiles deliver smooth overlays at scale.
	•	Use Pooler for all connections in IPv4 environments.
	•	Keep stg → core → app clean, indexed, and logged.