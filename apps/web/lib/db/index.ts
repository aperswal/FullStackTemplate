import { drizzle } from 'drizzle-orm/postgres-js';
import type { Logger as DrizzleLogger } from 'drizzle-orm/logger';
import postgres from 'postgres';

import { env } from '@/lib/env';
import { createLogger } from '@/lib/logger';
import * as schema from './schema';

const log = createLogger('db');

const POOL_SIZE_PRODUCTION = 20;
const POOL_SIZE_DEVELOPMENT = 5;
const IDLE_TIMEOUT_SECONDS = 20;
const CONNECT_TIMEOUT_SECONDS = 10;

const client = postgres(env.DATABASE_URL, {
  max: env.NODE_ENV === 'production' ? POOL_SIZE_PRODUCTION : POOL_SIZE_DEVELOPMENT,
  idle_timeout: IDLE_TIMEOUT_SECONDS,
  connect_timeout: CONNECT_TIMEOUT_SECONDS,
});

const queryLogger: DrizzleLogger = {
  logQuery(query: string, params: unknown[]) {
    log.debug({ params: params.length }, query);
  },
};

export const db = drizzle(client, {
  schema,
  logger: env.NODE_ENV !== 'production' ? queryLogger : undefined,
});

export type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];
