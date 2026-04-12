import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { createLogger } from '@/lib/logger';

const log = createLogger('health-check');

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);

    return NextResponse.json(
      { status: 'healthy', timestamp: new Date().toISOString() },
      { status: 200 },
    );
  } catch (error) {
    log.error({ err: error }, 'Health check failed');

    return NextResponse.json(
      { status: 'unhealthy', timestamp: new Date().toISOString() },
      { status: 503 },
    );
  }
}
