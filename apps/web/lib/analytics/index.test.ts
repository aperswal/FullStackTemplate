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
  let previousProvider: AnalyticsProvider;

  beforeEach(() => {
    previousProvider = {
      trackEvent: vi.fn(),
      identifyUser: vi.fn(),
      trackPageView: vi.fn(),
      trackRevenue: vi.fn(),
      group: vi.fn(),
      reset: vi.fn(),
    };
    setAnalyticsProvider(previousProvider);
    setAnalyticsProvider(null as unknown as AnalyticsProvider);
  });

  it('trackEvent is a no-op when no provider is set', () => {
    trackEvent('click');
    expect(previousProvider.trackEvent).not.toHaveBeenCalled();
  });

  it('identifyUser is a no-op when no provider is set', () => {
    identifyUser({ id: '123' });
    expect(previousProvider.identifyUser).not.toHaveBeenCalled();
  });

  it('trackPageView is a no-op when no provider is set', () => {
    trackPageView('/home');
    expect(previousProvider.trackPageView).not.toHaveBeenCalled();
  });

  it('trackRevenue is a no-op when no provider is set', () => {
    trackRevenue(29, 'usd');
    expect(previousProvider.trackRevenue).not.toHaveBeenCalled();
  });

  it('group is a no-op when no provider is set', () => {
    group('org-123');
    expect(previousProvider.group).not.toHaveBeenCalled();
  });

  it('resetAnalytics is a no-op when no provider is set', () => {
    resetAnalytics();
    expect(previousProvider.reset).not.toHaveBeenCalled();
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
