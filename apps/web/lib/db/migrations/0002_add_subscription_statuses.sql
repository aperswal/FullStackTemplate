-- Add missing Stripe subscription statuses to the enum
ALTER TYPE "subscription_status" ADD VALUE IF NOT EXISTS 'incomplete';
ALTER TYPE "subscription_status" ADD VALUE IF NOT EXISTS 'incomplete_expired';
ALTER TYPE "subscription_status" ADD VALUE IF NOT EXISTS 'unpaid';
ALTER TYPE "subscription_status" ADD VALUE IF NOT EXISTS 'paused';
