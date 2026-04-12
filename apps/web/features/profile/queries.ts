import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { user } from '@/lib/db/schema/auth';

export async function getProfile(userId: string) {
  const result = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return result[0] ?? null;
}
