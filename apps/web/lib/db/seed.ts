import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { hashPassword } from 'better-auth/crypto';

import * as schema from './schema';
import { user, account } from './schema/auth';

const SEED_ADMIN_EMAIL = 'admin@example.com';
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';
const SEED_ADMIN_USER_ID = 'seed-admin-001';
const SEED_ADMIN_ACCOUNT_ID = 'seed-admin-account-001';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required for seeding');
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema });

  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.warn(
      'WARNING: Using default admin password. Set SEED_ADMIN_PASSWORD env var in production.',
    );
  }

  console.log('Seeding database...');

  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, SEED_ADMIN_EMAIL))
    .limit(1);

  if (existing.length === 0) {
    const hashedPassword = await hashPassword(SEED_ADMIN_PASSWORD);

    await db.insert(user).values({
      id: SEED_ADMIN_USER_ID,
      name: 'Test Admin',
      email: SEED_ADMIN_EMAIL,
      emailVerified: true,
      role: 'admin',
    });

    await db.insert(account).values({
      id: SEED_ADMIN_ACCOUNT_ID,
      accountId: SEED_ADMIN_USER_ID,
      providerId: 'credential',
      userId: SEED_ADMIN_USER_ID,
      password: hashedPassword,
    });

    console.log(`Created test admin user with credential account: ${SEED_ADMIN_EMAIL}`);
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
