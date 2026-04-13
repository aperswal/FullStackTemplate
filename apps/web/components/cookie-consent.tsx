'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { COOKIE_CONSENT_KEY } from '@/lib/analytics/consent';

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_YEAR = 365;
const CONSENT_COOKIE_MAX_AGE =
  SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY * DAYS_PER_YEAR;

interface CookieConsent {
  analytics: boolean;
  necessary: boolean;
}

function setConsentCookie(consent: CookieConsent): void {
  document.cookie = `${COOKIE_CONSENT_KEY}=${JSON.stringify(consent)}; path=/; max-age=${CONSENT_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function CookieConsentBanner(): React.ReactNode {
  const t = useTranslations('cookie');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored === null) {
      setVisible(true);
    }
  }, []);

  function accept() {
    const consent: CookieConsent = { analytics: true, necessary: true };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    setConsentCookie(consent);
    setVisible(false);
    window.dispatchEvent(new CustomEvent('consent-updated', { detail: consent }));
  }

  function decline() {
    const consent: CookieConsent = { analytics: false, necessary: true };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    setConsentCookie(consent);
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div role="dialog" aria-label={t('ariaLabel')} className="fixed inset-x-0 bottom-0 z-50 p-4">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-lg border bg-background p-6 shadow-lg sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {t('message')}{' '}
          <a href="/privacy" className="underline hover:text-foreground">
            {t('privacyPolicy')}
          </a>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={decline}>
            {t('decline')}
          </Button>
          <Button size="sm" onClick={accept}>
            {t('accept')}
          </Button>
        </div>
      </div>
    </div>
  );
}
