import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/db/schema/index.ts',
  out: './lib/db/migrations',
  dbCredentials: {
    // drizzle-kit runs outside Next.js, so the validated env module is not available
    url: process.env.DATABASE_URL ?? '',
  },
});
