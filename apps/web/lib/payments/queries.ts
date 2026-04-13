import { eq } from 'drizzle-orm';
import type { UserRole, SubscriptionStatus } from '@template/shared';

import { db, type DbOrTx } from '@/lib/db';
import { subscription } from '@/lib/db/schema/subscriptions';
import { user, session } from '@/lib/db/schema/auth';

export async function getSubscriptionByUserId(
  userId: string,
  dbOrTx: DbOrTx = db,
): Promise<typeof subscription.$inferSelect | null> {
  const result = await dbOrTx.query.subscription.findFirst({
    where: eq(subscription.userId, userId),
  });
  return result ?? null;
}

export async function upsertSubscription(
  data: {
    id: string;
    userId: string;
    provider: string;
    externalSubscriptionId: string;
    externalPriceId: string;
    status: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  },
  dbOrTx: DbOrTx = db,
): Promise<void> {
  await dbOrTx
    .insert(subscription)
    .values(data)
    .onConflictDoUpdate({
      target: subscription.externalSubscriptionId,
      set: {
        status: data.status,
        externalPriceId: data.externalPriceId,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
        updatedAt: new Date(),
      },
    });
}

export async function updateUserRole(
  userId: string,
  role: UserRole,
  dbOrTx: DbOrTx = db,
): Promise<void> {
  await dbOrTx.update(user).set({ role, updatedAt: new Date() }).where(eq(user.id, userId));
  // Invalidate all sessions to force re-authentication with new role
  await dbOrTx.delete(session).where(eq(session.userId, userId));
}

export async function updateUserPaymentCustomerId(
  userId: string,
  paymentCustomerId: string,
  paymentProvider: string = 'stripe',
  dbOrTx: DbOrTx = db,
): Promise<void> {
  await dbOrTx
    .update(user)
    .set({ paymentCustomerId, paymentProvider, updatedAt: new Date() })
    .where(eq(user.id, userId));
}
