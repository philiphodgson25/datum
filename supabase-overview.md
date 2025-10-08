# 🧱 Supabase Project Overview (Reference)

### Purpose
Supabase is used as the **primary backend database and API layer** for managing spatial and tabular datasets (e.g., local planning authorities, conservation areas, flood risk zones).  
It provides a Postgres + PostGIS environment for:
- Cleanly ingesting external datasets (CSV, GeoJSON)
- Normalising them into a consistent schema
- Powering client apps or APIs via Supabase’s auto-generated REST & GraphQL endpoints

---

## ⚙️ Architecture

### Schemas (namespaces)
| Schema | Purpose | Typical contents |
|---------|----------|------------------|
| **stg** | *Staging / raw ingest* — mirrors source files 1:1, minimal typing. | `*_raw` tables used for temporary CSV/GeoJSON uploads. |
| **core** | *Authoritative, clean data* — typed, indexed, production-ready. | `core.local_planning_authorities`, `core.conservation_areas`, `core.flood_risk_zones`, etc. |
| **app** | *App-facing layer* — views, simplified joins, or RPCs exposed to frontend. | e.g. `app.conservation_areas`, `app.get_flood_risk_at_point(lon, lat)`. |
| **ref** | *Reference / lookup data* shared across datasets. | Code lists, organisations, etc. |
| **ops** | *Operational / logging / ETL bookkeeping.* | `ops.import_log`, data quality or checksum tables. |

> **Best practice:** app reads from `app.*` (or `core.*`), never from `stg.*`.

---

## 🗺️ Spatial Data (PostGIS)
- PostGIS is enabled (`create extension if not exists postgis;`).
- Each spatial table has a `geom geometry(<Type>, 4326)` column.
- Indexed with `GIST` for spatial lookups (`st_dwithin`, `st_contains`, etc.).
- Helper RPCs (e.g. `get_flood_risk_at_point`) return features intersecting a lat/lng point.

---


### Indexing for spatial queries
- **Geometry (degrees):**
  ```sql
  create index if not exists idx_<table>_geom on core.<table> using gist(geom);
  ```
- **Metre-based lookups (geography):**
  ```sql
  create index if not exists idx_<table>_geog on core.<table> using gist ((geom::geography));
  ```
- **Views are not indexable.** Create indexes on the underlying `core.*` tables powering `app.*` views.

### Query plans & planner behavior
- Verify index usage with `EXPLAIN ANALYZE`:
  ```sql
  explain analyze
  select *
  from app.<dataset>
  where st_dwithin(geom::geography, st_setsrid(st_point($lon,$lat),4326)::geography, $metres)
  limit 10;
  ```
- If an index exists but isn’t chosen (small table, broad radius, or stale stats), you can temporarily test with:
  ```sql
  set enable_seqscan = off;
  -- run EXPLAIN ANALYZE …
  set enable_seqscan = on;
  ```
- Improve selectivity estimates when needed:
  ```sql
  alter table core.<table> alter column geom set statistics 1000;
  analyze core.<table>;
  ```

## 🔁 Data Ingestion Workflow

1. **Upload**
   - Upload source files (CSV, GeoJSON) into `stg.<dataset>_raw` via Supabase Table Editor.
   - Keep the headers identical to the source.

2. **Transform**
   - Run a SQL transform to clean + type-cast data into `core.<dataset>`.

3. **Verify**
   - `select count(*) from core.<dataset>;`
   - Run sample queries or map overlays in your app.

4. **(Optional)** Log the import:
   ```sql
   insert into ops.import_log (source_name, target_table, row_count, status)
   values ('flood-risk-zones.csv','core.flood_risk_zones',12345,'ok');
   ```

5. **Expose**
   - Use an `app.<dataset>` view for stable, read-only access from your frontend.
   - Grant `SELECT` on `core` and `app` to `anon` and `authenticated` roles.

---

### Validate geometries before exposing to app
- Enforce SRID 4326 and fix invalid geometries during transform:
  ```sql
  -- Example for core.conservation_areas
  update core.conservation_areas
  set geom = st_multi(st_makevalid(geom))
  where not st_isvalid(geom);

  -- SRID check (expect 4326)
  select distinct st_srid(geom) from core.conservation_areas;
  ```


## 🔐 Access & Security

- **Public read**: allowed only on `app` and `core` (read-only).  
- **Private write**: restricted to service role; staging (`stg`) and ops are private.
- **RLS** (Row Level Security) enabled selectively — typically off for internal datasets.
- Default grants:
  ```sql
  grant usage on schema core, app to anon, authenticated;
  grant select on all tables in schema core, app to anon, authenticated;
  alter default privileges in schema core grant select on tables to anon, authenticated;
  ```

---

## 🧩 Structure & Naming Conventions

- `snake_case` for all identifiers.
- `_raw` suffix for staging tables.
- `_geom` column for geometries.
- Always include `created_at` / `updated_at` (trigger auto-updates).
- Index by geometry, identifiers, and any high-cardinality filters (e.g. `flood_risk_level`).

---

## 📦 Migration Management

- Migrations live in `/db/migrations/` and are run via Supabase SQL Editor or CLI.
- Each migration is **idempotent** (safe to rerun):
  - Uses `if not exists` or conditional logic to avoid duplicates.
- Example sequence:
  1. Schema creation
  2. Table definitions
  3. Indexes + triggers
  4. Grants + views
  5. Optional RPCs

---

## 🧠 Example Dataset Flow

**flood_risk_zones**
| Step | Table | Description |
|------|--------|--------------|
| Upload CSV | `stg.flood_risk_zones_raw` | Raw data with WKT point/geojson strings. |
| Transform | → `core.flood_risk_zones` | Casts types, adds `geom`, deduplicates via entity. |
| Expose | → `app.flood_risk_zones` | Read-only view for map layer or API. |
| Access | via Supabase REST or RPC `app.get_flood_risk_at_point`. |

---

## 🧭 Operational Tips

- **Schemas visible:** enable `core`, `stg`, `app`, `ops` in Supabase UI sidebar.  
- **Search path:**  
  ```sql
  alter role postgres in database postgres set search_path = "app","core","public";
  ```

- **Post-load statistics:** In the Studio SQL editor (transactional), run `ANALYZE` after bulk loads:
  ```sql
  analyze core.conservation_areas;
  analyze core.flood_risk_zones;
  analyze core.local_planning_authorities;
  ```
  If using CLI/psql outside a transaction, you can `VACUUM ANALYZE` as well.

- **Counts per stage (sanity check):**
  ```sql
  select count(*) from stg.<dataset>_raw;   -- uploaded?
  select count(*) from core.<dataset>;      -- transformed?
  select count(*) from app.<dataset>;       -- exposed?
  ```

- **New dataset checklist:**
  1. Create `stg.<name>_raw` table (from CSV headers).  
  2. Create `core.<name>` table (typed).  
  3. Add transform SQL (`stg` → `core`).  
  4. Add `app.<name>` view. **Index `geom` on the underlying `core.<name>` table** (views cannot be indexed).
  5. Grant read access on `core` + `app`.  


- **Minimal import log (optional):**
  ```sql
  create table if not exists ops.import_log (
    id bigserial primary key,
    source_name text not null,
    target_table text not null,
    row_count bigint,
    status text default 'ok',
    details jsonb default '{}'::jsonb,
    created_at timestamptz default now()
  );

  -- write a log entry after a successful transform
  insert into ops.import_log (source_name, target_table, row_count, status)
  select 'flood-risk-zones.csv','core.flood_risk_zones', count(*), 'ok'
  from core.flood_risk_zones;
  ```

---

## 🚀 Summary

Your Supabase instance is a **structured data lake + API** for spatial planning datasets.

- **stg** = raw uploads  
- **core** = cleaned & authoritative  
- **app** = exposed to frontend  
- **ref** = shared reference data  
- **ops** = operational logs  

This setup ensures:
- Clean separation between raw, curated, and public data.
- Consistent ingestion pattern for all future datasets.
- Safe migrations that can be re-run anytime.
- Easy expansion to hundreds of datasets with predictable structure.