import { randomUUID } from 'crypto';
import postgres from 'postgres';
import {
  DESIGNATION_DATASET_KEYS,
  type AddressDatasets,
  type ConservationAreaItem,
  type DatasetSource,
  type DesignationDatasetKey,
  type DesignationItem,
  type FloodZoneItem
} from '../schemas/address';

const MAX_CONSERVATION_RESULTS = 10;
const MAX_FLOOD_RESULTS = 8;
const MAX_GENERIC_RESULTS = 12;

function asIdentifier(...values: Array<unknown>): string {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const str = String(value).trim();
    if (str.length > 0) return str;
  }
  return randomUUID();
}

function cleanString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'bigint') return String(value);
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  return String(value);
}

function formatDate(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    return trimmed;
  }
  return null;
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

function normaliseConservationRow(
  row: Record<string, any>,
  source: DatasetSource
): ConservationAreaItem {
  return {
    id: asIdentifier(row.id, row.reference),
    name: row.name ?? null,
    lpa: row.lpa ?? null,
    designated_at: formatDate(row.designated_at),
    source
  };
}

function normaliseFloodRow(row: Record<string, any>, source: DatasetSource): FloodZoneItem {
  return {
    id: asIdentifier(row.id, row.reference, row.entity, row.dataset, row.name),
    name: row.name ?? null,
    level:
      row.flood_risk_level === null || row.flood_risk_level === undefined
        ? null
        : String(row.flood_risk_level),
    type: row.flood_risk_type ?? null,
    dataset: row.dataset ?? null,
    source
  };
}

async function lookupConservationAreas(
  sql: ReturnType<typeof postgres>,
  lat: number,
  lng: number
) {
  const appRows = await sql<Record<string, any>>`
    select
      id::text as id,
      name,
      lpa,
      designated_at
    from app.conservation_area_public
    where geom is not null
      and st_intersects(
        geom,
        ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)
      )
    order by designated_at desc nulls last, name asc
    limit ${MAX_CONSERVATION_RESULTS}
  `;

  if (appRows.length > 0) {
    return appRows.map((row) => normaliseConservationRow(row, 'app'));
  }

  const coreRows = await sql<Record<string, any>>`
    select
      id::text as id,
      name,
      lpa,
      designated_at
    from core.conservation_area_core
    where geom is not null
      and st_intersects(
        geom,
        ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)
      )
    order by designated_at desc nulls last, name asc
    limit ${MAX_CONSERVATION_RESULTS}
  `;

  return coreRows.map((row) => normaliseConservationRow(row, 'core'));
}

async function lookupFloodZones(
  sql: ReturnType<typeof postgres>,
  lat: number,
  lng: number
) {
  const appRows = await sql<Record<string, any>>`
    select
      coalesce(reference, entity::text) as id,
      reference,
      entity,
      name,
      flood_risk_level,
      flood_risk_type,
      dataset
    from app.flood_risk_zones
    where geom is not null
      and st_intersects(
        geom,
        ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)
      )
    limit ${MAX_FLOOD_RESULTS * 2}
  `;

  if (appRows.length > 0) {
    return dedupeById(appRows.map((row) => normaliseFloodRow(row, 'app'))).slice(
      0,
      MAX_FLOOD_RESULTS
    );
  }

  const coreRows = await sql<Record<string, any>>`
    select
      id::text as id,
      reference,
      entity,
      name,
      flood_risk_level,
      flood_risk_type,
      dataset
    from core.flood_risk_zones_core
    where geom is not null
      and st_intersects(
        geom,
        ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)
      )
    limit ${MAX_FLOOD_RESULTS * 2}
  `;

  return dedupeById(coreRows.map((row) => normaliseFloodRow(row, 'core'))).slice(
    0,
    MAX_FLOOD_RESULTS
  );
}

type TableQueryConfig = {
  table: string;
  geometryColumn?: string;
};

type NoteFieldConfig =
  | { field: string; label?: string }
  | { value: (_row: Record<string, any>) => string | null };

type NormaliseOptions = {
  nameField?: string;
  designationField?: string;
  defaultDesignation?: string | ((_row: Record<string, any>) => string | null);
  categoryField?: string;
  referenceField?: string;
  dateFields?: string[];
  documentationFields?: string[];
  notesFields?: NoteFieldConfig[];
  defaultName?: string | ((_row: Record<string, any>) => string | null);
  includeRowNotes?: boolean;
};

type DesignationConfig = {
  key: DesignationDatasetKey;
  app?: TableQueryConfig | null;
  core: TableQueryConfig;
  orderBy?: string;
  limit?: number;
  normalize: (_row: Record<string, any>, _source: DatasetSource) => DesignationItem;
};

function normaliseDesignationRow(
  row: Record<string, any>,
  source: DatasetSource,
  options: NormaliseOptions = {}
): DesignationItem {
  const {
    nameField = 'name',
    designationField = 'typology',
    defaultDesignation = null,
    categoryField = 'dataset',
    referenceField = 'reference',
    dateFields = ['start_date', 'entry_date', 'designation_date', 'valid_from'],
    documentationFields = ['documentation_url'],
    notesFields = [],
    defaultName = null,
    includeRowNotes = true
  } = options;

  const resolvedNameDefault =
    typeof defaultName === 'function' ? defaultName(row) : defaultName ?? null;
  const resolvedDesignationDefault =
    typeof defaultDesignation === 'function'
      ? defaultDesignation(row)
      : defaultDesignation ?? null;

  const id = asIdentifier(row.id, row.reference, row.dataset, row.entity, row.ogc_fid, row.name);
  const name = cleanString(row[nameField]) ?? resolvedNameDefault;
  const designation =
    (designationField ? cleanString(row[designationField]) ?? null : null) ??
    resolvedDesignationDefault;
  const category = cleanString(row[categoryField]) ?? null;
  const reference = cleanString(row[referenceField]) ?? null;

  let designationDate: string | null = null;
  for (const field of dateFields) {
    if (!field) continue;
    const value = formatDate(row[field]);
    if (value) {
      designationDate = value;
      break;
    }
  }

  let documentationUrl: string | null = null;
  for (const field of documentationFields) {
    if (!field) continue;
    const value = cleanString(row[field]);
    if (value) {
      documentationUrl = value.startsWith('http') ? value : null;
      if (documentationUrl) break;
    }
  }

  const notesParts: string[] = [];
  if (includeRowNotes) {
    const baseNote = cleanString(row.notes);
    if (baseNote) notesParts.push(baseNote);
  }

  for (const note of notesFields) {
    if ('value' in note) {
      const computed = note.value(row);
      if (computed) notesParts.push(computed);
    } else {
      const value = cleanString(row[note.field]);
      if (!value) continue;
      notesParts.push(note.label ? `${note.label}: ${value}` : value);
    }
  }

  return {
    id,
    name,
    designation,
    category,
    reference,
    designation_date: designationDate,
    documentation_url: documentationUrl,
    notes: notesParts.length ? notesParts.join(' • ') : null,
    source
  };
}

const RAW_DESIGNATION_CONFIGS: Record<DesignationDatasetKey, Omit<DesignationConfig, 'key'>> = {
  agriculturalLandClassification: {
    core: { table: 'core.agricultural_land_classification_core' },
    orderBy: 'order by t.name asc nulls last',
    normalize: (row, source) =>
      normaliseDesignationRow(row, source, {
        designationField: 'agricultural_land_classification_grade',
        notesFields: [{ label: 'Grade', field: 'agricultural_land_classification_grade' }]
      })
  },
  ancientWoodland: {
    app: { table: 'app.ancient_woodland_public' },
    core: { table: 'core.ancient_woodland_core' },
    orderBy: 'order by t.name asc',
    normalize: (row, source) =>
      normaliseDesignationRow(row, source, {
        designationField: 'ancient_status',
        notesFields: [
          {
            value: (r) => {
              const area = cleanString(r.area_ha);
              return area ? `Area: ${area} ha` : null;
            }
          }
        ]
      })
  },
  archaeologicalPriorityAreas: {
    core: { table: 'core.archaeological_priority_area_core' },
    orderBy: 'order by t.name asc',
    normalize: (row, source) =>
      normaliseDesignationRow(row, source, {
        notesFields: [{ label: 'Risk tier', field: 'archaeological_risk_tier' }]
      })
  },
  areasOfOutstandingNaturalBeauty: {
    core: { table: 'core.area_of_outstanding_natural_beauty_core' },
    orderBy: 'order by t.start_date desc nulls last, t.name asc',
    normalize: (row, source) =>
      normaliseDesignationRow(row, source, {
        documentationFields: ['documentation_url', 'website'],
        notesFields: [
          {
            value: (r) => {
              const wiki = cleanString(r.wikipedia);
              return wiki ? `Wikipedia: https://en.wikipedia.org/wiki/${wiki}` : null;
            }
          },
          {
            value: (r) => {
              const wikidata = cleanString(r.wikidata);
              return wikidata ? `Wikidata: ${wikidata}` : null;
            }
          }
        ]
      })
  },
  article4DirectionAreas: {
    core: { table: 'core.article_4_direction_area_core' },
    orderBy: 'order by t.start_date desc nulls last, t.name asc',
    normalize: (row, source) =>
      normaliseDesignationRow(row, source, {
        notesFields: [
          { label: 'Direction', field: 'article_4_direction' },
          { label: 'Description', field: 'description' }
        ]
      })
  },
  assetsOfCommunityValue: {
    core: { table: 'core.asset_of_community_value_core' },
    orderBy: 'order by t.decision_date desc nulls last, t.name asc',
    normalize: (row, source) =>
      normaliseDesignationRow(row, source, {
        notesFields: [
          { label: 'Decision', field: 'decision' },
          { label: 'Decision date', value: (r) => formatDate(r.decision_date) },
          { label: 'Expiry date', value: (r) => formatDate(r.expiry_date) },
          { label: 'Nomination date', value: (r) => formatDate(r.nomination_date) },
          { label: 'Nominating group', field: 'nominating_group' }
        ]
      })
  },
  battlefields: {
    core: { table: 'core.battlefield_core' },
    orderBy: 'order by t.name asc',
    normalize: (row, source) =>
      normaliseDesignationRow(row, source, {
        documentationFields: ['documentation_url', 'document_url'],
        notesFields: [
          {
            value: (r) => {
              const wikipedia = cleanString(r.wikipedia);
              return wikipedia ? `Wikipedia: https://en.wikipedia.org/wiki/${wikipedia}` : null;
            }
          },
          {
            value: (r) => {
              const wikidata = cleanString(r.wikidata);
              return wikidata ? `Wikidata: ${wikidata}` : null;
            }
          }
        ]
      })
  },
  borders: {
    core: { table: 'core.border_core' },
    orderBy: 'order by t.name asc',
    normalize: (row, source) => normaliseDesignationRow(row, source)
  },
  brownfieldLand: {
    core: { table: 'core.brownfield_land_core' },
    orderBy: 'order by t.start_date desc nulls last, t.name asc',
    normalize: (row, source) =>
      normaliseDesignationRow(row, source, {
        notesFields: [
          { label: 'Deliverable', field: 'deliverable' },
          { label: 'Ownership', field: 'ownership_status' },
          { label: 'Planning status', field: 'planning_permission_status' },
          { label: 'Planning type', field: 'planning_permission_type' },
          { label: 'Maximum dwellings', field: 'maximum_net_dwellings' },
          { label: 'Minimum dwellings', field: 'minimum_net_dwellings' }
        ],
        documentationFields: ['site_plan_url', 'documentation_url']
      })
  },
  brownfieldSites: {
    core: { table: 'core.brownfield_site_core' },
    orderBy: 'order by t.start_date desc nulls last, t.name asc',
    normalize: (row, source) =>
      normaliseDesignationRow(row, source, {
        notesFields: [{ label: 'Site code', field: 'brownfield_site' }]
      })
  },
  builtUpAreas: {
    core: { table: 'core.built_up_area_core' },
    orderBy: 'order by t.name asc',
    normalize: (row, source) => normaliseDesignationRow(row, source)
  },
  certificatesOfImmunity: {
    core: { table: 'core.certificate_of_immunity_core' },
    orderBy: 'order by t.name asc',
    normalize: (row, source) => normaliseDesignationRow(row, source)
  },
  designCodeAreas: {
    core: { table: 'core.designcodearea_core' },
    orderBy: 'order by t.name asc',
    normalize: (row, source) => normaliseDesignationRow(row, source)
  },
  floodStorageAreas: {
    core: { table: 'core.floodstoragearea_core' },
    orderBy: 'order by t.name asc',
    normalize: (row, source) =>
      normaliseDesignationRow(row, source, {
        defaultName: (r) => cleanString(r.name) ?? 'Flood storage area',
        defaultDesignation: 'Flood storage area'
      })
  },
  greenBelt: {
    app: { table: 'app.green_belt_public' },
    core: { table: 'core.green_belt' },
    normalize: (row, source) =>
      normaliseDesignationRow(row, source, {
        defaultName: 'Green Belt',
        defaultDesignation: 'Green Belt',
        categoryField: 'local_authority_district',
        notesFields: [{ field: 'typology' }]
      })
  },
  listedBuildings: {
    core: { table: 'core.listedbuilding_core' },
    orderBy: 'order by t.start_date desc nulls last, t.name asc',
    normalize: (row, source) =>
      normaliseDesignationRow(row, source, {
        designationField: 'grade',
        notesFields: [{ label: 'Grade', field: 'grade' }]
      })
  },
  localPlanningAuthorities: {
    app: { table: 'app.local_planning_authority_public', geometryColumn: 'boundary' },
    core: { table: 'core.local_planning_authority_core', geometryColumn: 'boundary' },
    orderBy: 'order by t.valid_to desc nulls last, t.name asc',
    limit: 4,
    normalize: (row, source) =>
      normaliseDesignationRow(row, source, {
        defaultDesignation: 'Local planning authority',
        documentationFields: ['source_url'],
        notesFields: [
          {
            value: (r) =>
              r.is_active === true
                ? 'Status: Active'
                : r.is_active === false
                  ? 'Status: Historical'
                  : null
          },
          { label: 'Source', field: 'source_name' }
        ]
      })
  },
  localAuthorityDistricts: {
    core: { table: 'core.localauthoritydistrict_core' },
    orderBy: 'order by t.name asc',
    normalize: (row, source) => normaliseDesignationRow(row, source)
  },
  nationalParks: {
    core: { table: 'core.nationalpark_core' },
    orderBy: 'order by t.start_date desc nulls last, t.name asc',
    normalize: (row, source) => normaliseDesignationRow(row, source)
  },
  parishes: {
    core: { table: 'core.parish_core' },
    orderBy: 'order by t.name asc',
    normalize: (row, source) => normaliseDesignationRow(row, source)
  },
  parksAndGardens: {
    core: { table: 'core.parkandgarden_core' },
    orderBy: 'order by t.start_date desc nulls last, t.name asc',
    normalize: (row, source) =>
      normaliseDesignationRow(row, source, {
        notesFields: [{ label: 'Grade', field: 'park_and_garden_grade' }]
      })
  },
  planningApplications: {
    core: { table: 'core.planningapplication_core' },
    orderBy: 'order by t.decision_date desc nulls last, t.start_date desc nulls last',
    normalize: (row, source) =>
      normaliseDesignationRow(row, source, {
        notesFields: [
          { label: 'Decision', field: 'planning_decision' },
          { label: 'Decision date', value: (r) => formatDate(r.decision_date) },
          { label: 'Decision type', field: 'planning_decision_type' },
          { label: 'Status', field: 'planning_application_status' }
        ],
        documentationFields: ['documentation_url']
      })
  },
  ramsarSites: {
    core: { table: 'core.ramsar_core' },
    orderBy: 'order by t.name asc',
    normalize: (row, source) =>
      normaliseDesignationRow(row, source, {
        notesFields: [
          { label: 'Ramsar ID', field: 'ramsar' },
          { label: 'SPA', field: 'special_protection_area' },
          {
            value: (r) => {
              const wikipedia = cleanString(r.wikipedia);
              return wikipedia ? `Wikipedia: https://en.wikipedia.org/wiki/${wikipedia}` : null;
            }
          }
        ],
        documentationFields: ['documentation_url']
      })
  },
  regions: {
    core: { table: 'core.region_core' },
    orderBy: 'order by t.name asc',
    normalize: (row, source) => normaliseDesignationRow(row, source)
  },
  scheduledMonuments: {
    core: { table: 'core.scheduledmonument_core' },
    orderBy: 'order by t.start_date desc nulls last, t.name asc',
    normalize: (row, source) => normaliseDesignationRow(row, source)
  },
  sitesOfSpecialScientificInterest: {
    core: { table: 'core.siteofspecialscientificinterest_core' },
    orderBy: 'order by t.name asc',
    normalize: (row, source) => normaliseDesignationRow(row, source)
  },
  specialAreasOfConservation: {
    core: { table: 'core.specialareaofconservation_core' },
    orderBy: 'order by t.start_date desc nulls last, t.name asc',
    normalize: (row, source) => normaliseDesignationRow(row, source)
  },
  specialProtectionAreas: {
    core: { table: 'core.specialprotectionarea_core' },
    orderBy: 'order by t.start_date desc nulls last, t.name asc',
    normalize: (row, source) => normaliseDesignationRow(row, source)
  },
  titleBoundaries: {
    core: { table: 'core.titleboundary_core' },
    orderBy: 'order by t.start_date desc nulls last, t.reference asc',
    normalize: (row, source) =>
      normaliseDesignationRow(row, source, {
        defaultName: 'Title boundary',
        defaultDesignation: 'Title boundary'
      })
  },
  wards: {
    core: { table: 'core.ward_core' },
    orderBy: 'order by t.name asc',
    normalize: (row, source) => normaliseDesignationRow(row, source)
  },
  worldHeritageSites: {
    core: { table: 'core.worldheritagesite_core' },
    orderBy: 'order by t.start_date desc nulls last, t.name asc',
    normalize: (row, source) =>
      normaliseDesignationRow(row, source, {
        documentationFields: ['documentation_url'],
        notesFields: [
          {
            value: (r) => {
              const convention = cleanString(r.world_heritage_convention_site);
              return convention ? `Convention site: ${convention}` : null;
            }
          },
          {
            value: (r) => {
              const wikipedia = cleanString(r.wikipedia);
              return wikipedia ? `Wikipedia: https://en.wikipedia.org/wiki/${wikipedia}` : null;
            }
          },
          {
            value: (r) => {
              const wikidata = cleanString(r.wikidata);
              return wikidata ? `Wikidata: ${wikidata}` : null;
            }
          }
        ]
      })
  },
  worldHeritageSiteBufferZones: {
    core: { table: 'core.worldheritagesitebufferzone_core' },
    orderBy: 'order by t.start_date desc nulls last, t.name asc',
    normalize: (row, source) =>
      normaliseDesignationRow(row, source, {
        documentationFields: ['documentation_url'],
        notesFields: [{ label: 'World Heritage Site', field: 'world_heritage_site' }]
      })
  }
};

const DESIGNATION_CONFIGS: DesignationConfig[] = DESIGNATION_DATASET_KEYS.map((key) => ({
  key,
  ...RAW_DESIGNATION_CONFIGS[key]
}));

async function queryDesignationTable(
  sql: ReturnType<typeof postgres>,
  config: TableQueryConfig | null | undefined,
  lat: number,
  lng: number,
  limit: number,
  orderBy?: string
): Promise<Record<string, any>[]> {
  if (!config) return [];
  const orderClause = orderBy ? ` ${orderBy}` : '';
  const geometryColumn = config.geometryColumn ?? 'geom';
  const geometryExpression = `t.${geometryColumn}`;

  try {
    const rows = await sql.unsafe(`
      select
        (to_jsonb(t.*) - 'geom' - 'geom_simple' - 'boundary' - 'centroid') as record
      from ${config.table} as t
      where ${geometryExpression} is not null
        and st_intersects(
          ${geometryExpression},
          ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)
        )
      ${orderClause}
      limit ${limit}
    `);
    return rows.map((row: any) => row.record as Record<string, any>);
  } catch (error: any) {
    if (error && typeof error === 'object' && error.code === '42P01') {
      return [];
    }
    throw error;
  }
}

async function lookupDesignationDataset(
  sql: ReturnType<typeof postgres>,
  lat: number,
  lng: number,
  config: DesignationConfig
): Promise<DesignationItem[]> {
  const limit = config.limit ?? MAX_GENERIC_RESULTS;
  const appRows = await queryDesignationTable(sql, config.app, lat, lng, limit, config.orderBy);
  if (appRows.length > 0) {
    return dedupeById(appRows.map((row) => config.normalize(row, 'app')));
  }

  const coreRows = await queryDesignationTable(sql, config.core, lat, lng, limit, config.orderBy);
  return dedupeById(coreRows.map((row) => config.normalize(row, 'core')));
}

export async function fetchAddressDatasets(
  lat: number,
  lng: number,
  databaseUrl: string
): Promise<AddressDatasets> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('Invalid coordinates supplied for dataset lookup.');
  }

  if (!databaseUrl || databaseUrl.trim().length === 0) {
    throw new Error('DATABASE_URL is not configured; unable to query Supabase datasets.');
  }

  const sql = postgres(databaseUrl, {
    ssl: 'require',
    prepare: false
  });

  try {
    const conservationAreas = await lookupConservationAreas(sql, lat, lng);
    const floodZones = await lookupFloodZones(sql, lat, lng);
    const designationResults = await Promise.all(
      DESIGNATION_CONFIGS.map((config) => lookupDesignationDataset(sql, lat, lng, config))
    );

    const designationMap = DESIGNATION_CONFIGS.reduce<
      Record<DesignationDatasetKey, DesignationItem[]>
    >((acc, config, index) => {
      acc[config.key] = designationResults[index] ?? [];
      return acc;
    }, {} as Record<DesignationDatasetKey, DesignationItem[]>);

    return {
      conservationAreas,
      floodZones,
      ...designationMap
    };
  } finally {
    await sql.end({ timeout: 5 });
  }
}
