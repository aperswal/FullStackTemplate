import posthog from 'posthog-js';

import type { AnalyticsProvider, AnalyticsUser, AnalyticsEventProperties } from './index';
import { hasAnalyticsConsent } from './consent';

export function initPostHog(apiKey: string, apiHost: string): void {
  if (typeof window === 'undefined') return;
  if (!hasAnalyticsConsent()) return;

  posthog.init(apiKey, {
    api_host: apiHost,
    capture_pageview: false,
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
  });
}

export const posthogProvider: AnalyticsProvider = {
  trackEvent(name: string, properties?: AnalyticsEventProperties): void {
    if (!hasAnalyticsConsent()) return;
    posthog.capture(name, properties ?? {});
  },

  identifyUser(user: AnalyticsUser): void {
    if (!hasAnalyticsConsent()) return;
    posthog.identify(user.id, {
      email: user.email,
      name: user.name,
      ...user,
    });
  },

  trackPageView(url?: string): void {
    if (!hasAnalyticsConsent()) return;
    posthog.capture('$pageview', url ? { $current_url: url } : {});
  },

  trackRevenue(amount: number, currency: string, properties?: AnalyticsEventProperties): void {
    if (!hasAnalyticsConsent()) return;
    posthog.capture('purchase', { amount, currency, ...properties });
  },

  group(groupId: string, properties?: AnalyticsEventProperties): void {
    if (!hasAnalyticsConsent()) return;
    posthog.group('company', groupId, properties);
  },

  reset(): void {
    posthog.reset();
  },
};
