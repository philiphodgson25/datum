import { db } from '../lib/db';
import { datasources, datasets } from '../lib/schema';

async function main() {
  console.log('🌱 Seeding data sources and datasets...\n');

  // Seed data sources
  const [planningDataSource] = await db
    .insert(datasources)
    .values([
      {
        name: 'Planning.data.gov.uk',
        type: 'aggregator',
        priority: 1,
        base_url: 'https://www.planning.data.gov.uk',
        status: 'active',
        reliability_score: 0.95
      },
      {
        name: 'Historic England',
        type: 'primary',
        priority: 1,
        base_url: 'https://services.historicengland.org.uk',
        status: 'active',
        reliability_score: 0.98
      },
      {
        name: 'Ordnance Survey Places API',
        type: 'primary',
        priority: 2,
        base_url: 'https://api.os.uk',
        status: 'active',
        reliability_score: 0.99
      },
      {
        name: 'PlanIt API',
        type: 'aggregator',
        priority: 3,
        base_url: 'https://www.planit.org.uk',
        status: 'beta',
        reliability_score: 0.85
      }
    ])
    .returning();

  console.log(`✅ Created ${4} data sources`);

  // Seed datasets for Planning.data.gov.uk
  await db.insert(datasets).values([
    {
      datasource_id: planningDataSource.id,
      dataset_type: 'conservation_areas',
      schema_version: 'v1.0.0',
      geography_coverage: { england: true },
      completeness_estimate: 0.85,
      refresh_frequency: '1 day'
    },
    {
      datasource_id: planningDataSource.id,
      dataset_type: 'listed_buildings',
      schema_version: 'v1.0.0',
      geography_coverage: { england: true },
      completeness_estimate: 0.90,
      refresh_frequency: '1 day'
    },
    {
      datasource_id: planningDataSource.id,
      dataset_type: 'article_4_directions',
      schema_version: 'v1.0.0',
      geography_coverage: { england: true },
      completeness_estimate: 0.70,
      refresh_frequency: '1 week'
    },
    {
      datasource_id: planningDataSource.id,
      dataset_type: 'local_plans',
      schema_version: 'v1.0.0',
      geography_coverage: { england: true },
      completeness_estimate: 0.80,
      refresh_frequency: '1 week'
    }
  ]);

  console.log(`✅ Created datasets for Planning.data.gov.uk\n`);
  console.log('🎉 Seeding complete!');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });

