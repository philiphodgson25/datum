import { pgTable, text, uuid, timestamp, index, uniqueIndex, integer, doublePrecision, boolean, jsonb, interval } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Minimal schema for MVP: users + runs only

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(),
    email: text('email').notNull(),
    tenant_id: uuid('tenant_id'),
    created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow()
  },
  (t) => ({
    emailIdx: uniqueIndex('users_email_unique').on(t.email)
  })
);

export const runs = pgTable(
  'runs',
  {
    id: uuid('id').primaryKey(),
    uprn: text('uprn'), // nullable for now
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tenant_id: uuid('tenant_id'),
    status: text('status').notNull(),
    model: text('model'),
    prompt_version: text('prompt_version'),
    created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow()
  },
  (t) => ({
    tenantIdx: index('runs_tenant_idx').on(t.tenant_id),
    userIdx: index('runs_user_idx').on(t.user_id)
  })
);

// ──────────────────────────────────────────────────────────────────────────────
// DATA LINEAGE TABLES - Track where planning data comes from
// ──────────────────────────────────────────────────────────────────────────────

export const datasources = pgTable('datasources', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'aggregator', 'primary', 'scraped'
  priority: integer('priority').notNull().default(5),
  base_url: text('base_url'),
  status: text('status').notNull().default('active'), // 'active', 'deprecated', 'beta'
  reliability_score: doublePrecision('reliability_score').default(1.0),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow()
});

export const datasets = pgTable('datasets', {
  id: uuid('id').primaryKey().defaultRandom(),
  datasource_id: uuid('datasource_id')
    .notNull()
    .references(() => datasources.id, { onDelete: 'cascade' }),
  dataset_type: text('dataset_type').notNull(), // 'conservation_areas', 'listed_buildings', etc.
  schema_version: text('schema_version').default('v1.0.0'),
  geography_coverage: jsonb('geography_coverage'), // Which LPAs covered
  completeness_estimate: doublePrecision('completeness_estimate').default(1.0),
  last_validated_at: timestamp('last_validated_at', { withTimezone: true, mode: 'date' }),
  refresh_frequency: interval('refresh_frequency'), // e.g., '1 day'
  created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow()
}, (t) => ({
  datasourceIdx: index('datasets_datasource_idx').on(t.datasource_id)
}));

export const data_records = pgTable('data_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  dataset_id: uuid('dataset_id')
    .notNull()
    .references(() => datasets.id, { onDelete: 'cascade' }),
  external_id: text('external_id').notNull(),
  data: jsonb('data').notNull(),
  geometry: jsonb('geometry'), // Store as JSONB for now (can upgrade to PostGIS later)
  source_hash: text('source_hash').notNull(),
  fetched_at: timestamp('fetched_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  validated_at: timestamp('validated_at', { withTimezone: true, mode: 'date' }),
  is_superseded: boolean('is_superseded').default(false),
  superseded_by: uuid('superseded_by'),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow()
}, (t) => ({
  datasetIdx: index('data_records_dataset_idx').on(t.dataset_id),
  externalIdIdx: index('data_records_external_id_idx').on(t.external_id),
  datasetExternalUnique: uniqueIndex('data_records_dataset_external_unique').on(
    t.dataset_id,
    t.external_id,
    t.source_hash
  )
}));

export const data_quality_metrics = pgTable('data_quality_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  dataset_id: uuid('dataset_id')
    .notNull()
    .references(() => datasets.id, { onDelete: 'cascade' }),
  metric_date: timestamp('metric_date', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
  total_records: integer('total_records').default(0),
  null_critical_fields: integer('null_critical_fields').default(0),
  duplicate_records: integer('duplicate_records').default(0),
  stale_records: integer('stale_records').default(0),
  coverage_gaps: jsonb('coverage_gaps'),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow()
}, (t) => ({
  datasetIdx: index('quality_metrics_dataset_idx').on(t.dataset_id),
  dateIdx: index('quality_metrics_date_idx').on(t.metric_date)
}));

export const data_sync_log = pgTable('data_sync_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  dataset_id: uuid('dataset_id')
    .notNull()
    .references(() => datasets.id, { onDelete: 'cascade' }),
  sync_started_at: timestamp('sync_started_at', { withTimezone: true, mode: 'date' }).notNull(),
  sync_completed_at: timestamp('sync_completed_at', { withTimezone: true, mode: 'date' }),
  records_added: integer('records_added').default(0),
  records_updated: integer('records_updated').default(0),
  records_deleted: integer('records_deleted').default(0),
  errors: jsonb('errors'),
  status: text('status').notNull().default('success'), // 'success', 'partial', 'failed'
  created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow()
}, (t) => ({
  datasetIdx: index('sync_log_dataset_idx').on(t.dataset_id),
  startedIdx: index('sync_log_started_idx').on(t.sync_started_at)
}));

// Relations for data lineage
export const datasourcesRelations = relations(datasources, ({ many }) => ({
  datasets: many(datasets)
}));

export const datasetsRelations = relations(datasets, ({ one, many }) => ({
  datasource: one(datasources, {
    fields: [datasets.datasource_id],
    references: [datasources.id]
  }),
  records: many(data_records),
  quality_metrics: many(data_quality_metrics),
  sync_logs: many(data_sync_log)
}));

export const dataRecordsRelations = relations(data_records, ({ one }) => ({
  dataset: one(datasets, {
    fields: [data_records.dataset_id],
    references: [datasets.id]
  }),
  superseding_record: one(data_records, {
    fields: [data_records.superseded_by],
    references: [data_records.id]
  })
}));

// ──────────────────────────────────────────────────────────────────────────────
// COMMENTED OUT FOR LATER
// ──────────────────────────────────────────────────────────────────────────────

// export const tenants = pgTable('tenants', {
//   id: uuid('id').primaryKey().defaultRandom(),
//   name: text('name').notNull(),
//   created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow()
// });

// export const user_tenants = pgTable('user_tenants', {
//   user_id: uuid('user_id').notNull(),
//   tenant_id: uuid('tenant_id').notNull(),
//   created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow()
// });

// export const sites = pgTable('sites', {
//   uprn: text('uprn').primaryKey(),
//   tenant_id: uuid('tenant_id'),
//   address: text('address'),
//   lat: doublePrecision('lat'),
//   lon: doublePrecision('lon'),
//   lpa_code: text('lpa_code'),
//   created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow()
// }, (t) => ({
//   tenantUprnUnique: uniqueIndex('sites_tenant_uprn_unique').on(t.tenant_id, t.uprn),
//   lpaIdx: index('sites_lpa_idx').on(t.lpa_code)
// }));

// export const evidence_items = pgTable('evidence_items', {
//   id: uuid('id').primaryKey().defaultRandom(),
//   tenant_id: uuid('tenant_id'),
//   run_id: uuid('run_id').references(() => runs.id, { onDelete: 'cascade' }),
//   type: text('type').notNull(),
//   source_url: text('source_url'),
//   source_name: text('source_name'),
//   retrieved_at: timestamp('retrieved_at', { withTimezone: true, mode: 'date' }),
//   data: jsonb('data'),
//   created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow()
// }, (t) => ({
//   runIdx: index('evidence_run_idx').on(t.run_id)
// }));

// export const policy_citations = pgTable('policy_citations', {
//   id: uuid('id').primaryKey().defaultRandom(),
//   tenant_id: uuid('tenant_id'),
//   run_id: uuid('run_id').references(() => runs.id, { onDelete: 'cascade' }),
//   policy_level: text('policy_level').notNull(),
//   citation: text('citation').notNull(),
//   url: text('url'),
//   created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow()
// }, (t) => ({
//   runIdx: index('policy_run_idx').on(t.run_id)
// }));

// export const generated_docs = pgTable('generated_docs', {
//   id: uuid('id').primaryKey().defaultRandom(),
//   tenant_id: uuid('tenant_id'),
//   run_id: uuid('run_id').references(() => runs.id, { onDelete: 'cascade' }),
//   fmt: text('fmt').notNull(),
//   path: text('path'),
//   sha256: text('sha256'),
//   created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow()
// }, (t) => ({
//   runFmtUnique: uniqueIndex('generated_docs_run_fmt_unique').on(t.run_id, t.fmt)
// }));

// Relations
// export const usersRelations = relations(users, ({ many, one }) => ({
//   runs: many(runs),
//   tenant: one(tenants, {
//     fields: [users.tenant_id],
//     references: [tenants.id]
//   })
// }));

// export const runsRelations = relations(runs, ({ one, many }) => ({
//   site: one(sites, {
//     fields: [runs.uprn],
//     references: [sites.uprn]
//   }),
//   user: one(users, {
//     fields: [runs.user_id],
//     references: [users.id]
//   }),
//   evidence: many(evidence_items),
//   citations: many(policy_citations),
//   documents: many(generated_docs)
// }));

