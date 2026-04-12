import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';
import { user } from './schema/auth';

const SEED_ADMIN_EMAIL = 'admin@example.com';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required for seeding');
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema });

  console.log('Seeding database...');

  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, SEED_ADMIN_EMAIL))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(user).values({
      id: 'seed-admin-001',
      name: 'Test Admin',
      email: SEED_ADMIN_EMAIL,
      emailVerified: true,
      role: 'admin',
    });
    console.log(`Created test admin user: ${SEED_ADMIN_EMAIL}`);
  } else {
    console.log(`Test admin user already exists: ${SEED_ADMIN_EMAIL}`);
  }

  console.log('Seeding complete.');
  await client.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
