import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// No 'server-only' here so the seed and migrate scripts can import it; lib/db/index.ts guards app code.

const g = globalThis as unknown as { __omnideskPool?: Pool };

function makePool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set. Copy .env.example to .env.local and point it at your Postgres database.');
  return new Pool({
    connectionString: url,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    ssl: process.env.DATABASE_SSL === '1' ? { rejectUnauthorized: false } : undefined,
  });
}

// Reuse one pool across dev hot reloads.
export const pool = g.__omnideskPool ?? (g.__omnideskPool = makePool());
export const orm = drizzle(pool, { schema });
export { schema };
