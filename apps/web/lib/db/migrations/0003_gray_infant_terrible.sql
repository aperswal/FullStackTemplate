ALTER TYPE "public"."subscription_status" ADD VALUE 'incomplete';--> statement-breakpoint
ALTER TYPE "public"."subscription_status" ADD VALUE 'incomplete_expired';--> statement-breakpoint
ALTER TYPE "public"."subscription_status" ADD VALUE 'unpaid';--> statement-breakpoint
ALTER TYPE "public"."subscription_status" ADD VALUE 'paused';--> statement-breakpoint
ALTER TABLE "webhook_event" ADD COLUMN "event_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "webhook_event" ADD COLUMN "payload" text;--> statement-breakpoint
ALTER TABLE "webhook_event" ADD COLUMN "status" text DEFAULT 'processed' NOT NULL;--> statement-breakpoint
ALTER TABLE "webhook_event" ADD COLUMN "error_message" text;--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_expires_at_idx" ON "session" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "user_payment_customer_id_idx" ON "user" USING btree ("payment_customer_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "subscription_user_id_idx" ON "subscription" USING btree ("user_id");