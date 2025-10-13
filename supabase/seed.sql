-- Ensure schema exists
create schema if not exists catalog;

-- Temp staging table shaped like the CSV
create temp table datasets_csv (
  table_name text,
  source_url text,
  provider text,
  collector_last_ran_on date,
  new_data_last_found_on date,
  last_ingested_at timestamptz,
  licence text,
  origin text
);

-- Load CSV (treat blank fields as NULL)
\copy datasets_csv (table_name,source_url,provider,collector_last_ran_on,new_data_last_found_on,last_ingested_at,licence,origin) from './seed/catalog_datasets.csv' with (format csv, header true, null '');

-- Upsert into real table by table_name
insert into catalog.datasets (
  table_name, source_url, provider,
  collector_last_ran_on, new_data_last_found_on,
  licence, attribution, last_ingested_at
)
select
  table_name, source_url, provider,
  collector_last_ran_on, new_data_last_found_on,
  licence, origin, last_ingested_at
from datasets_csv
on conflict (table_name) do update set
  source_url = excluded.source_url,
  provider = excluded.provider,
  collector_last_ran_on = excluded.collector_last_ran_on,
  new_data_last_found_on = excluded.new_data_last_found_on,
  licence = excluded.licence,
  attribution = excluded.attribution,
  last_ingested_at = excluded.last_ingested_at;

