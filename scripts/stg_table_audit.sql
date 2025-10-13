select 
  c.relname as table_name,
  pg_size_pretty(pg_total_relation_size(c.oid)) as table_size,
  pg_stat_all_tables.last_vacuum,
  pg_stat_all_tables.last_autovacuum,
  pg_stat_all_tables.last_analyze,
  pg_stat_all_tables.last_autoanalyze,
  c.relpages,
  c.reltuples::bigint as approx_row_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_stat_all_tables on pg_stat_all_tables.relid = c.oid
where n.nspname = 'stg'
  and c.relname in (
    'agricultural_land_classification_raw',
    'ancient_woodland_raw',
    'archaeological_priority_area_raw',
    'area_of_outstanding_natural_beauty_raw',
    'article_4_direction_area_raw',
    'asset_of_community_value_raw',
    'battlefield_raw',
    'border_raw',
    'brownfield_land_raw',
    'brownfield_site_raw',
    'built_up_area_raw',
    'certificate_of_immunity_raw',
    'conservation_area_raw',
    'designcodearea_raw',
    'flood_risk_zones_raw',
    'floodstoragearea_raw',
    'green_belt_raw',
    'listedbuilding_raw',
    'local_planning_authority_raw',
    'localauthoritydistrict_raw',
    'nationalpark_raw',
    'parish_raw',
    'parkandgarden_raw',
    'planningapplication_raw',
    'ramsar_raw',
    'region_raw',
    'scheduledmonument_raw',
    'siteofspecialscientificinterest_raw',
    'specialareaofconservation_raw',
    'specialprotectionarea_raw',
    'titleboundary_raw',
    'ward_raw',
    'worldheritagesite_raw',
    'worldheritagesitebufferzone_raw'
  )
order by c.relname;
