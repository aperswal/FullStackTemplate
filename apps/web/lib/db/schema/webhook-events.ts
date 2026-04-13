import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';

export const webhookEvent = pgTable(
  'webhook_event',
  {
    id: text('id').primaryKey(),
    eventType: text('event_type').notNull(),
    payload: text('payload'),
    status: text('status').notNull().default('processed'),
    errorMessage: text('error_message'),
    processedAt: timestamp('processed_at').notNull().defaultNow(),
  },
  (table) => [
    index('webhook_event_status_idx').on(table.status),
    index('webhook_event_event_type_idx').on(table.eventType),
  ],
);
