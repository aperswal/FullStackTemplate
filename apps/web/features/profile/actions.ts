'use server';

import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { user } from '@/lib/db/schema/auth';
import { withServerAction } from '@/lib/api/with-server-action';
import { updateProfileSchema } from './profile.schema';
import type { UpdateProfileInput } from './profile.schema';

export const updateProfile = withServerAction(
  'updateProfile',
  async (input: UpdateProfileInput, { session }) => {
    const validated = updateProfileSchema.parse(input);

    await db
      .update(user)
      .set({
        name: validated.name,
        image: validated.image !== undefined && validated.image !== '' ? validated.image : null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));

    return { success: true };
  },
);
