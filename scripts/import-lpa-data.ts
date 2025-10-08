// scripts/import-lpa-data.ts
// Import Local Planning Authority data from CSV + GeoJSON into Supabase

import './utils/loadEnv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import * as path from 'path';
import { env } from '../lib/env';

// ----------------------
// ✅ Initialise Supabase
// ----------------------
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ----------------------
// 📁 File paths
// ----------------------
const DATA_DIR = path.join(
  process.env.HOME!,
  'Library/CloudStorage/GoogleDrive-phil@latentmade.com/My Drive/Work/Datum/Data/local-planning-authority'
);

const CSV_PATH = path.join(DATA_DIR, 'local-planning-authority.csv');
const GEOJSON_PATH = path.join(DATA_DIR, 'local-planning-authority.geojson');

// ----------------------
// 📄 Type definitions
// ----------------------
interface CSVRow {
  dataset: string;
  'end-date': string;
  entity: string;
  'entry-date': string;
  name: string;
  'organisation-entity': string;
  point: string;
  prefix: string;
  reference: string;
  'start-date': string;
  typology: string;
  notes: string;
  organisation: string;
  region: string;
}

interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    entity: string;
    reference: string;
    name: string;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: any;
  };
}

// ----------------------
// 🧠 Helpers
// ----------------------
function parseDate(input: string | null | undefined): string | null {
  if (!input) return null;
  const s = String(input).trim();
  if (!s) return null;

  // DD/MM/YYYY
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [_, d, mo, y] = m;
    const dd = d.padStart(2, '0');
    const mm = mo.padStart(2, '0');
    return `${y}-${mm}-${dd}`; // YYYY-MM-DD
  }

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  return null;
}

function parsePoint(pointStr: string): { lng: number; lat: number } | null {
  if (!pointStr) return null;
  const match = pointStr.match(/POINT \(([^ ]+) ([^ ]+)\)/);
  if (!match) return null;
  return {
    lng: parseFloat(match[1]),
    lat: parseFloat(match[2]),
  };
}

// 🔧 Ensure Polygon is converted to MultiPolygon
function normaliseGeometry(geometry: any): any {
  if (!geometry) return null;
  if (geometry.type === 'Polygon') {
    return {
      type: 'MultiPolygon',
      coordinates: [geometry.coordinates],
    };
  }
  return geometry;
}

function chunk<T>(arr: T[], size = 200): T[][]
{
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ----------------------
// 🚀 Import Function
// ----------------------
async function importLPAs() {
  console.log('🚀 Starting LPA import...\n');

  // Step 1: Read CSV file
  console.log('📄 Reading CSV file...');
  const csvContent = readFileSync(CSV_PATH, 'utf-8');
  const csvRecords = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  }) as CSVRow[];
  console.log(`✓ Found ${csvRecords.length} records in CSV\n`);

  // Step 2: Read GeoJSON
  console.log('🗺️  Reading GeoJSON file...');
  const geojsonContent = readFileSync(GEOJSON_PATH, 'utf-8');
  const geojson = JSON.parse(geojsonContent);
  const features = geojson.features as GeoJSONFeature[];
  console.log(`✓ Found ${features.length} features in GeoJSON\n`);

  // Step 3: Build lookup map
  const boundaryMap = new Map<string, GeoJSONFeature>();
  for (const feature of features) {
    boundaryMap.set(feature.properties.reference, feature);
  }

  // Step 4: Prepare rows and UPSERT in batches
  console.log('💾 Preparing rows for upsert...\n');

  const rows = [];
  let polygonsConverted = 0;
  let withEndDate = 0;
  let withBoundary = 0;

  for (const row of csvRecords) {
    const point = parsePoint(row.point);
    const feature = boundaryMap.get(row.reference);
    const geometry = feature?.geometry ? normaliseGeometry(feature.geometry) : null;

    if (geometry) withBoundary++;
    if (feature?.geometry?.type === 'Polygon') polygonsConverted++;

    const valid_from = parseDate(row['start-date']);
    const valid_to = parseDate(row['end-date']);
    if (valid_to) withEndDate++;

    // Use GeoJSON for geometry columns so PostgREST casts correctly to PostGIS
    rows.push({
      entity: row.entity,
      reference: row.reference,
      name: row.name,
      organisation_id: row['organisation-entity'] || null,
      valid_from,
      valid_to,
      entry_date: parseDate(row['entry-date']),
      centroid: point ? { type: 'Point', coordinates: [point.lng, point.lat] } : null,
      boundary: geometry || null,
      source_name: 'planning.data.gov.uk',
      source_url: 'https://www.planning.data.gov.uk/dataset/local-planning-authority',
      source_updated: '2025-10-03',
    });
  }

  console.log(`• Rows prepared: ${rows.length}`);
  console.log(`• With boundary: ${withBoundary}`);
  console.log(`• Polygons converted to MultiPolygon: ${polygonsConverted}`);
  console.log(`• With end-date (historical): ${withEndDate}\n`);

  console.log('⬆️  Upserting to Supabase in batches...\n');
  let imported = 0;
  let errors = 0;
  const errorDetails: any[] = [];

  const batches = chunk(rows, 200);
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const { error } = await supabase
      .from('local_planning_authorities')
      .upsert(batch, { onConflict: 'entity' }); // entity is UNIQUE, so this merges

    if (error) {
      errors++;
      errorDetails.push({ batch: i + 1, error: error.message });
      console.error(`  ❌ Batch ${i + 1}/${batches.length} failed:`, error.message);
    } else {
      imported += batch.length;
      console.log(`  ✓ Batch ${i + 1}/${batches.length} upserted (${batch.length})`);
    }
  }

  // Step 5: Verify import
  console.log('\n📊 Verifying import...');
  const { data: stats } = await supabase.rpc('get_lpa_stats');
  if (stats && stats.length > 0) {
    const s = stats[0];
    console.log(`\n✅ Import complete!`);
    console.log(`   Total LPAs: ${s.total_lpas}`);
    console.log(`   Active: ${s.active_lpas}`);
    console.log(`   Historical: ${s.historical_lpas}`);
    console.log(`   With boundaries: ${s.with_boundaries}`);
  }

  console.log(`\n📈 Import summary (from upsert step):`);
  console.log(`   Rows sent: ${imported}`);
  console.log(`   Batch errors: ${errors}`);

  if (errors > 0) {
    console.log(`\n❌ Errors encountered:`);
    errorDetails.forEach((e: any) => {
      console.log(`   - Batch ${e.batch}: ${e.error}`);
    });
  }

  // Step 6: Test query
  console.log('\n🧪 Testing point-in-polygon query...');
  const { data: bathLPA } = await supabase.rpc('get_lpa_by_point', {
    lat: 51.3813,
    lng: -2.3590,
  });

  if (bathLPA && bathLPA.length > 0) {
    console.log(`✓ Test passed! Found: ${bathLPA[0].name}`);
  } else {
    console.log(`⚠️  Test failed - no LPA found for Bath coordinates`);
  }

  console.log('\n🎉 Import process complete!\n');
}

// Run import
importLPAs().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
