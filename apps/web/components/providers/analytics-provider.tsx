'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { setAnalyticsProvider, trackPageView } from '@/lib/analytics';
import { hasAnalyticsConsent } from '@/lib/analytics/consent';
import { initPostHog, posthogProvider } from '@/lib/analytics/posthog';

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
    function tryInit() {
      if (initialized.current) {
        return;
      }
      if (
        posthogKey === undefined ||
        posthogKey === '' ||
        posthogHost === undefined ||
        posthogHost === ''
      ) {
        return;
      }
      if (!hasAnalyticsConsent()) {
        return;
      }

      initPostHog(posthogKey, posthogHost);
      setAnalyticsProvider(posthogProvider);
      initialized.current = true;
    }

    tryInit();

    function onConsentUpdated() {
      tryInit();
    }

    window.addEventListener('consent-updated', onConsentUpdated);
    return () => {
      window.removeEventListener('consent-updated', onConsentUpdated);
    };
  }, [posthogKey, posthogHost]);

  useEffect(() => {
    if (!initialized.current) {
      return;
    }
    const qs = searchParams?.toString() ?? '';
    const url = pathname + (qs !== '' ? `?${qs}` : '');
    trackPageView(url);
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsProvider({
  posthogKey,
  posthogHost,
  children,
}: AnalyticsProviderProps): React.ReactNode {
  return (
    <>
      <AnalyticsTrackerInner posthogKey={posthogKey} posthogHost={posthogHost} />
      {children}
    </>
  );
}
