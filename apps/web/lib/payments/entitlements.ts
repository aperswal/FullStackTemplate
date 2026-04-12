import { PLANS } from '@template/shared';
import type { UserRole } from '@template/shared';

import { getSubscriptionByUserId, updateUserRole } from './queries';

export async function syncRoleFromSubscription(userId: string): Promise<void> {
  const sub = await getSubscriptionByUserId(userId);

  if (!sub || sub.status === 'canceled') {
    await updateUserRole(userId, 'free');
    return;
  }

  const plan = Object.values(PLANS).find((p) => p.externalPriceId === sub.externalPriceId);
  if (plan) {
    await updateUserRole(userId, plan.role);
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
    throw new Error(`Upgrade required: ${feature} is not available on the ${role} plan`);
  }
}
