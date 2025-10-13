import { z } from 'zod';
import { coordinatesSchema, lpaRecordSchema } from './lpa';

export const datasetSourceSchema = z.enum(['app', 'core']);

export const conservationAreaItemSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  lpa: z.string().nullable(),
  designated_at: z.string().nullable(),
  source: datasetSourceSchema
});

export const floodZoneItemSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  level: z.string().nullable(),
  type: z.string().nullable(),
  dataset: z.string().nullable(),
  source: datasetSourceSchema
});

export const designationItemSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  designation: z.string().nullable(),
  category: z.string().nullable(),
  reference: z.string().nullable(),
  designation_date: z.string().nullable(),
  documentation_url: z.string().nullable(),
  notes: z.string().nullable(),
  source: datasetSourceSchema
});

export const DESIGNATION_DATASET_KEYS = [
  'agriculturalLandClassification',
  'ancientWoodland',
  'archaeologicalPriorityAreas',
  'areasOfOutstandingNaturalBeauty',
  'article4DirectionAreas',
  'assetsOfCommunityValue',
  'battlefields',
  'borders',
  'brownfieldLand',
  'brownfieldSites',
  'builtUpAreas',
  'certificatesOfImmunity',
  'designCodeAreas',
  'floodStorageAreas',
  'greenBelt',
  'listedBuildings',
  'localPlanningAuthorities',
  'localAuthorityDistricts',
  'nationalParks',
  'parishes',
  'parksAndGardens',
  'planningApplications',
  'ramsarSites',
  'regions',
  'scheduledMonuments',
  'sitesOfSpecialScientificInterest',
  'specialAreasOfConservation',
  'specialProtectionAreas',
  'titleBoundaries',
  'wards',
  'worldHeritageSites',
  'worldHeritageSiteBufferZones'
] as const;

export type DesignationDatasetKey = (typeof DESIGNATION_DATASET_KEYS)[number];

export const DESIGNATION_DATASET_LABELS: Record<DesignationDatasetKey, string> = {
  agriculturalLandClassification: 'Agricultural land classification',
  ancientWoodland: 'Ancient woodland',
  archaeologicalPriorityAreas: 'Archaeological priority areas',
  areasOfOutstandingNaturalBeauty: 'Areas of Outstanding Natural Beauty',
  article4DirectionAreas: 'Article 4 direction areas',
  assetsOfCommunityValue: 'Assets of community value',
  battlefields: 'Battlefields',
  borders: 'National borders',
  brownfieldLand: 'Brownfield land',
  brownfieldSites: 'Brownfield sites',
  builtUpAreas: 'Built-up areas',
  certificatesOfImmunity: 'Certificates of immunity',
  designCodeAreas: 'Design code areas',
  floodStorageAreas: 'Flood storage areas',
  greenBelt: 'Green Belt',
  listedBuildings: 'Listed buildings',
  localPlanningAuthorities: 'Local planning authorities',
  localAuthorityDistricts: 'Local authority districts',
  nationalParks: 'National parks',
  parishes: 'Parishes',
  parksAndGardens: 'Parks and gardens',
  planningApplications: 'Planning applications',
  ramsarSites: 'Ramsar sites',
  regions: 'Regions',
  scheduledMonuments: 'Scheduled monuments',
  sitesOfSpecialScientificInterest: 'Sites of Special Scientific Interest',
  specialAreasOfConservation: 'Special Areas of Conservation',
  specialProtectionAreas: 'Special Protection Areas',
  titleBoundaries: 'Title boundaries',
  wards: 'Wards',
  worldHeritageSites: 'World Heritage Sites',
  worldHeritageSiteBufferZones: 'World Heritage Site buffer zones'
};

const designationArraysShape = DESIGNATION_DATASET_KEYS.reduce<Record<DesignationDatasetKey, z.ZodArray<typeof designationItemSchema>>>(
  (shape, key) => {
    shape[key] = z.array(designationItemSchema);
    return shape;
  },
  {} as Record<DesignationDatasetKey, z.ZodArray<typeof designationItemSchema>>
);

export const addressDatasetsSchema = z.object({
  conservationAreas: z.array(conservationAreaItemSchema),
  floodZones: z.array(floodZoneItemSchema),
  ...designationArraysShape
});

export const addressLookupResponseSchema = z.object({
  coordinates: coordinatesSchema,
  lpa: lpaRecordSchema.nullable(),
  datasets: addressDatasetsSchema
});

export type AddressLookupResponse = z.infer<typeof addressLookupResponseSchema>;
export type AddressDatasets = z.infer<typeof addressDatasetsSchema>;
export type DatasetSource = z.infer<typeof datasetSourceSchema>;
export type ConservationAreaItem = z.infer<typeof conservationAreaItemSchema>;
export type FloodZoneItem = z.infer<typeof floodZoneItemSchema>;
export type DesignationItem = z.infer<typeof designationItemSchema>;
