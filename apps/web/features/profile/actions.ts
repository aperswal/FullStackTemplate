'use server';

import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';

import { auth } from '@/lib/auth/server';
import { ClientError } from '@/lib/errors';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema/auth';
import { updateProfileSchema } from './profile.schema';
import type { UpdateProfileInput } from './profile.schema';

export async function updateProfile(input: UpdateProfileInput) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new ClientError('Not authenticated', { statusCode: 401 });

  const validated = updateProfileSchema.parse(input);

  await db
    .update(user)
    .set({
      name: validated.name,
      image: validated.image || null,
      updatedAt: new Date(),
    })
    .where(eq(user.id, session.user.id));

  return { success: true };
}
