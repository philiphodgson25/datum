import 'server-only';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { env } from './env';
import * as schema from './schema';

declare global {
  // eslint-disable-next-line no-var, no-unused-vars
  var __db__: ReturnType<typeof drizzle> | undefined;
}

let instance: ReturnType<typeof drizzle> | undefined;

if (env.DATABASE_URL && env.DATABASE_URL.length > 0) {
  const client = postgres(env.DATABASE_URL, {
    ssl: 'require',
    prepare: false
  });
  instance = drizzle(client, { schema });
}

export const db: ReturnType<typeof drizzle> =
  global.__db__ ??
  (instance ||
    (new Proxy(
      {},
      {
        get() {
          throw new Error(
            'Database is not configured. Set DATABASE_URL in .env.local before using db.'
          );
        }
      }
    ) as unknown as ReturnType<typeof drizzle>));

if (process.env.NODE_ENV !== 'production') global.__db__ = db;

export const dbConfigured = Boolean(instance);

