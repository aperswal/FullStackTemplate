import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const webhookEvent = pgTable('webhook_event', {
  id: text('id').primaryKey(),
  processedAt: timestamp('processed_at').notNull().defaultNow(),
});
