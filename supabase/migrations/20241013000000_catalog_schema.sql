-- Schema + tables
create schema if not exists catalog;

create table if not exists catalog.datasets (
  id bigserial primary key,
  table_name text unique not null,
  source_url text,
  provider text,
  licence text,
  attribution text,
  collector_last_ran_on date,
  new_data_last_found_on date,
  last_ingested_at timestamptz,
  upstream_meta jsonb not null default '{}'
);

create table if not exists catalog.ingest_runs (
  id bigserial primary key,
  dataset_id bigint not null references catalog.datasets(id) on delete cascade,
  ingested_at timestamptz not null default now(),
  rows_loaded integer,
  source_checksum text,
  notes text
);

-- Helpful indexes
create index if not exists idx_datasets_new_data_last_found_on on catalog.datasets (new_data_last_found_on);
create index if not exists idx_datasets_last_ingested_at on catalog.datasets (last_ingested_at);
create index if not exists idx_ingest_runs_dataset_ingested_at on catalog.ingest_runs (dataset_id, ingested_at desc);

