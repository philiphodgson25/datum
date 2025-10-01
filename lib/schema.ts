import { pgTable, text, uuid, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
// import { relations } from 'drizzle-orm';

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

