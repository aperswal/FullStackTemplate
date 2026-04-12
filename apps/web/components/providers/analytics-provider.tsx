'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { setAnalyticsProvider, trackPageView } from '@/lib/analytics';
import { initPostHog, posthogProvider } from '@/lib/analytics/posthog';

const COOKIE_CONSENT_KEY = 'cookie-consent';

function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) return false;
    const parsed = JSON.parse(stored) as { analytics?: boolean };
    return parsed.analytics === true;
  } catch {
    return false;
  }
}

interface AnalyticsProviderProps {
  posthogKey?: string;
  posthogHost?: string;
  children: React.ReactNode;
}

function AnalyticsTrackerInner({
  posthogKey,
  posthogHost,
}: {
  posthogKey?: string;
  posthogHost?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    if (!posthogKey || !posthogHost) return;
    if (!hasAnalyticsConsent()) return;

    initPostHog(posthogKey, posthogHost);
    setAnalyticsProvider(posthogProvider);
    initialized.current = true;
  }, [posthogKey, posthogHost]);

  useEffect(() => {
    if (!initialized.current) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    trackPageView(url);
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsProvider({ posthogKey, posthogHost, children }: AnalyticsProviderProps) {
  return (
    <>
      <AnalyticsTrackerInner posthogKey={posthogKey} posthogHost={posthogHost} />
      {children}
    </>
  );
}
