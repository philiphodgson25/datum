import './scripts/utils/loadEnv';
import { defineConfig } from 'drizzle-kit';
import { env } from './lib/env';

export default defineConfig({
  schema: './lib/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  driver: 'pg',
  dbCredentials: {
    connectionString: env.DATABASE_URL
  },
  strict: true,
  verbose: true
});
