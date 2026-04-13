import { eq } from 'drizzle-orm';

import { user } from '@/lib/db/schema/auth';

/**
 * Returns a Drizzle filter that scopes queries to the given user's data.
 * Use this in all queries that return user-specific data to enforce row-level access.
 */
export function withOwnership(userId: string): ReturnType<typeof eq> {
  return eq(user.id, userId);
}
