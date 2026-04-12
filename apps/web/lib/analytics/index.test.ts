import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  setAnalyticsProvider,
  trackEvent,
  identifyUser,
  trackPageView,
  trackRevenue,
  group,
  resetAnalytics,
} from './index';
import type { AnalyticsProvider } from './index';

describe('analytics with no provider', () => {
  beforeEach(() => {
    setAnalyticsProvider(null as unknown as AnalyticsProvider);
  });

  it('trackEvent does not throw when no provider is set', () => {
    expect(() => trackEvent('click')).not.toThrow();
  });

  it('identifyUser does not throw when no provider is set', () => {
    expect(() => identifyUser({ id: '123' })).not.toThrow();
  });

  it('trackPageView does not throw when no provider is set', () => {
    expect(() => trackPageView('/home')).not.toThrow();
  });

  it('trackRevenue does not throw when no provider is set', () => {
    expect(() => trackRevenue(29, 'usd')).not.toThrow();
  });

  it('group does not throw when no provider is set', () => {
    expect(() => group('org-123')).not.toThrow();
  });

  it('resetAnalytics does not throw when no provider is set', () => {
    expect(() => resetAnalytics()).not.toThrow();
  });
});

describe('analytics with provider', () => {
  let mockProvider: AnalyticsProvider;

  beforeEach(() => {
    mockProvider = {
      trackEvent: vi.fn(),
      identifyUser: vi.fn(),
      trackPageView: vi.fn(),
      trackRevenue: vi.fn(),
      group: vi.fn(),
      reset: vi.fn(),
    };
    setAnalyticsProvider(mockProvider);
  });

  it('trackEvent delegates to provider', () => {
    trackEvent('click');
    expect(mockProvider.trackEvent).toHaveBeenCalledWith('click', undefined);
  });

  it('trackEvent passes properties to provider', () => {
    trackEvent('click', { button: 'submit' });
    expect(mockProvider.trackEvent).toHaveBeenCalledWith('click', {
      button: 'submit',
    });
  });

  it('identifyUser delegates to provider', () => {
    identifyUser({ id: '123', email: 'a@b.com' });
    expect(mockProvider.identifyUser).toHaveBeenCalledWith({
      id: '123',
      email: 'a@b.com',
    });
  });

  it('trackPageView delegates to provider', () => {
    trackPageView('/home');
    expect(mockProvider.trackPageView).toHaveBeenCalledWith('/home');
  });

  it('trackPageView passes undefined when no url given', () => {
    trackPageView();
    expect(mockProvider.trackPageView).toHaveBeenCalledWith(undefined);
  });

  it('trackRevenue delegates to provider', () => {
    trackRevenue(29, 'usd', { plan: 'pro' });
    expect(mockProvider.trackRevenue).toHaveBeenCalledWith(29, 'usd', {
      plan: 'pro',
    });
  });

  it('group delegates to provider', () => {
    group('org-123', { name: 'Acme' });
    expect(mockProvider.group).toHaveBeenCalledWith('org-123', {
      name: 'Acme',
    });
  });

  it('resetAnalytics delegates to provider reset', () => {
    resetAnalytics();
    expect(mockProvider.reset).toHaveBeenCalled();
  });
});
