import { eq } from 'drizzle-orm';
import type { UserRole, SubscriptionStatus } from '@template/shared';

import { db } from '@/lib/db';
import { subscription } from '@/lib/db/schema/subscriptions';
import { user } from '@/lib/db/schema/auth';

export async function getSubscriptionByUserId(userId: string) {
  const result = await db.query.subscription.findFirst({
    where: eq(subscription.userId, userId),
  });
  return result ?? null;
}

export async function getSubscriptionByExternalId(externalSubscriptionId: string) {
  const result = await db.query.subscription.findFirst({
    where: eq(subscription.externalSubscriptionId, externalSubscriptionId),
  });
  return result ?? null;
}

export async function upsertSubscription(data: {
  id: string;
  userId: string;
  provider: string;
  externalSubscriptionId: string;
  externalPriceId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}) {
  await db
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

export async function updateUserRole(userId: string, role: UserRole) {
  await db.update(user).set({ role, updatedAt: new Date() }).where(eq(user.id, userId));
}

export async function updateUserPaymentCustomerId(
  userId: string,
  paymentCustomerId: string,
  paymentProvider: string = 'stripe',
) {
  await db
    .update(user)
    .set({ paymentCustomerId, paymentProvider, updatedAt: new Date() })
    .where(eq(user.id, userId));
}
