import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { withApiRoute } from '@/lib/api/with-api-route';
import { ServerError } from '@/lib/errors';

export const GET = withApiRoute(
  { auth: 'none', rateLimit: 'health', methods: ['GET'] },
  async (_request, { log }) => {
    try {
      await db.execute(sql`SELECT 1`);

      return NextResponse.json(
        { status: 'healthy', timestamp: new Date().toISOString() },
        { status: 200 },
      );
    } catch (error) {
      log.error({ err: error }, 'Health check failed - database unreachable');
      throw new ServerError('Database health check failed', {
        statusCode: 503,
        userMessage: 'Service is temporarily unavailable.',
      });
    }
  },
);
