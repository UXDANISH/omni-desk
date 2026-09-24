/** Applies the SQL migrations in ./drizzle. Run: npm run db:migrate */
import { config } from 'dotenv';

config({ path: ['.env.local', '.env'] });

async function main() {
  const { migrate } = await import('drizzle-orm/node-postgres/migrator');
  const { orm, pool } = await import('../lib/db/client');
  await migrate(orm, { migrationsFolder: './drizzle' });
  console.log('Migrations applied.');
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
