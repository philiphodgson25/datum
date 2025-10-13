-- SQL Template
-- Author: Philip
-- Date: {{DATE}}

-- Write your SQL here
create index if not exists certificate_of_immunity_core_geom_idx
  on core.certificate_of_immunity_core using gist (geom);

create index if not exists localauthoritydistrict_core_geom_idx
  on core.localauthoritydistrict_core using gist (geom);

create index if not exists nationalpark_core_geom_idx
  on core.nationalpark_core using gist (geom);

create index if not exists planningapplication_core_geom_idx
  on core.planningapplication_core using gist (geom);

create index if not exists ramsar_core_geom_idx
  on core.ramsar_core using gist (geom);

create index if not exists region_core_geom_idx
  on core.region_core using gist (geom);

create index if not exists scheduledmonument_core_geom_idx
  on core.scheduledmonument_core using gist (geom);

create index if not exists siteofspecialscientificinterest_core_geom_idx
  on core.siteofspecialscientificinterest_core using gist (geom);

create index if not exists specialareaofconservation_core_geom_idx
  on core.specialareaofconservation_core using gist (geom);

create index if not exists specialprotectionarea_core_geom_idx
  on core.specialprotectionarea_core using gist (geom);

create index if not exists ward_core_geom_idx
  on core.ward_core using gist (geom);

create index if not exists worldheritagesite_core_geom_idx
  on core.worldheritagesite_core using gist (geom);

create index if not exists worldheritagesitebufferzone_core_geom_idx
  on core.worldheritagesitebufferzone_core using gist (geom);
