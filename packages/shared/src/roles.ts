/** User role definitions — the single source of truth for authorization levels. */

export const USER_ROLES = ['free', 'pro', 'admin'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  free: 0,
  pro: 1,
  admin: 2,
};
