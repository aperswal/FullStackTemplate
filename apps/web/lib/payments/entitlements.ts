import { PLANS } from '@template/shared';
import type { UserRole } from '@template/shared';
import { ClientError } from '@/lib/errors';
import type { DbOrTx } from '@/lib/db';

import { getSubscriptionByUserId, updateUserRole } from './queries';

export async function syncRoleFromSubscription(userId: string, dbOrTx?: DbOrTx): Promise<void> {
  const sub = await getSubscriptionByUserId(userId, dbOrTx);

  if (!sub || sub.status === 'canceled') {
    await updateUserRole(userId, 'free', dbOrTx);
    return;
  }

  const plan = Object.values(PLANS).find((p) => p.externalPriceId === sub.externalPriceId);
  if (plan) {
    await updateUserRole(userId, plan.role, dbOrTx);
  }
}

export function getUserEntitlements(role: UserRole) {
  return {
    canAccessProFeatures: role === 'pro' || role === 'admin',
    canExportData: role === 'pro' || role === 'admin',
    canAccessAPI: role === 'pro' || role === 'admin',
    canManageUsers: role === 'admin',
    maxProjects: role === 'free' ? 1 : Infinity,
  };
}

export function requireEntitlement(
  role: UserRole,
  feature: keyof ReturnType<typeof getUserEntitlements>,
): void {
  const entitlements = getUserEntitlements(role);
  if (!entitlements[feature]) {
    throw new ClientError(`Upgrade required: ${feature} is not available on the ${role} plan`, {
      statusCode: 403,
    });
  }
}
