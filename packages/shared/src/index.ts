/** @template/shared - single source of truth for types, constants, and interfaces shared across the monorepo. */

export { USER_ROLES, ROLE_HIERARCHY } from './roles';
export type { UserRole } from './roles';

export { SUBSCRIPTION_STATUSES } from './subscriptions';
export type { SubscriptionStatus, PaymentProviderName } from './subscriptions';

export { AppError, ClientError, ServerError, ExternalServiceError } from './errors';
export type { Blame, ErrorResponseBody } from './errors';

export { PLANS } from './plans';
export type { PlanConfig } from './plans';

export type {
  PaymentProvider,
  CheckoutParams,
  PortalParams,
  WebhookEvent,
  WebhookEventData,
  WebhookEventType,
} from './payments';

export type { ApiResponse, ApiError, PaginatedResult } from './api';
