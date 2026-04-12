/**
 * Abstract analytics interface.
 * All tracking flows through these functions so the concrete provider
 * can be swapped without touching feature code.
 */

export interface AnalyticsEventProperties {
  [key: string]: string | number | boolean | null | undefined;
}

export interface AnalyticsUser {
  id: string;
  email?: string;
  name?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface AnalyticsProvider {
  trackEvent: (name: string, properties?: AnalyticsEventProperties) => void;
  identifyUser: (user: AnalyticsUser) => void;
  trackPageView: (url?: string) => void;
  trackRevenue: (amount: number, currency: string, properties?: AnalyticsEventProperties) => void;
  group: (groupId: string, properties?: AnalyticsEventProperties) => void;
  reset: () => void;
}

let activeProvider: AnalyticsProvider | null = null;

export function setAnalyticsProvider(provider: AnalyticsProvider): void {
  activeProvider = provider;
}

export function trackEvent(name: string, properties?: AnalyticsEventProperties): void {
  activeProvider?.trackEvent(name, properties);
}

export function identifyUser(user: AnalyticsUser): void {
  activeProvider?.identifyUser(user);
}

export function trackPageView(url?: string): void {
  activeProvider?.trackPageView(url);
}

export function trackRevenue(
  amount: number,
  currency: string,
  properties?: AnalyticsEventProperties,
): void {
  activeProvider?.trackRevenue(amount, currency, properties);
}

export function group(groupId: string, properties?: AnalyticsEventProperties): void {
  activeProvider?.group(groupId, properties);
}

export function resetAnalytics(): void {
  activeProvider?.reset();
}
