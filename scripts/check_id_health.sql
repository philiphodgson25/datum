-- SQL Template
-- Author: Philip
-- Date: {{DATE}}

-- Write your SQL here
-- check_id_health.sql

-- 1. archaeological_priority_area_core
select 'archaeological_priority_area_core' as table,
  count(*) filter (where id is null) as nulls,
  count(id) - count(distinct id) as duplicates
from core.archaeological_priority_area_core;

-- 2. asset_of_community_value_core
select 'asset_of_community_value_core' as table,
  count(*) filter (where id is null) as nulls,
  count(id) - count(distinct id) as duplicates
from core.asset_of_community_value_core;

-- 3. battlefield_core
select 'battlefield_core' as table,
  count(*) filter (where id is null) as nulls,
  count(id) - count(distinct id) as duplicates
from core.battlefield_core;

-- 4. border_core
select 'border_core' as table,
  count(*) filter (where id is null) as nulls,
  count(id) - count(distinct id) as duplicates
from core.border_core;

-- 5. brownfield_land_core
select 'brownfield_land_core' as table,
  count(*) filter (where id is null) as nulls,
  count(id) - count(distinct id) as duplicates
from core.brownfield_land_core;

-- 6. brownfield_site_core
select 'brownfield_site_core' as table,
  count(*) filter (where id is null) as nulls,
  count(id) - count(distinct id) as duplicates
from core.brownfield_site_core;

-- 7. built_up_area_core
select 'built_up_area_core' as table,
  count(*) filter (where id is null) as nulls,
  count(id) - count(distinct id) as duplicates
from core.built_up_area_core;

-- 8. certificate_of_immunity_core
select 'certificate_of_immunity_core' as table,
  count(*) filter (where id is null) as nulls,
  count(id) - count(distinct id) as duplicates
from core.certificate_of_immunity_core;

-- 9. conservation_area_core
select 'conservation_area_core' as table,
  count(*) filter (where id is null) as nulls,
  count(id) - count(distinct id) as duplicates
from core.conservation_area_core;
