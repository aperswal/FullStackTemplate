/** Payment provider abstraction - normalized interface for any payment processor. */

export interface CheckoutParams {
  userId: string;
  userEmail: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  customerId?: string;
}

export interface PortalParams {
  customerId: string;
  returnUrl: string;
}

export interface WebhookEventData {
  externalCustomerId: string;
  externalSubscriptionId: string;
  externalPriceId: string;
  status: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}

export type WebhookEventType =
  | 'checkout.completed'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'subscription.updated'
  | 'subscription.deleted'
  | 'subscription.paused'
  | 'payment.action_required';

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  data: WebhookEventData;
}

export interface PaymentProvider {
  createCheckoutSession(params: CheckoutParams): Promise<{ redirectUrl: string }>;
  createPortalSession(params: PortalParams): Promise<{ redirectUrl: string }>;
  constructWebhookEvent(body: string, signature: string): Promise<WebhookEvent>;
}
