import { pgTable, text, timestamp, boolean, pgEnum, unique } from 'drizzle-orm/pg-core';
import { SUBSCRIPTION_STATUSES } from '@template/shared';

import { user } from './auth';

export const subscriptionStatusEnum = pgEnum(
  'subscription_status',
  SUBSCRIPTION_STATUSES as unknown as [string, ...string[]],
);

export const subscription = pgTable(
  'subscription',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull().default('stripe'),
    externalSubscriptionId: text('external_subscription_id').notNull().unique(),
    externalPriceId: text('external_price_id').notNull(),
    status: subscriptionStatusEnum('status').notNull().default('active'),
    currentPeriodStart: timestamp('current_period_start').notNull(),
    currentPeriodEnd: timestamp('current_period_end').notNull(),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [unique('subscription_user_provider_unique').on(table.userId, table.provider)],
);
