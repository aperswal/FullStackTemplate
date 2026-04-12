'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

const COOKIE_CONSENT_KEY = 'cookie-consent';

interface CookieConsent {
  analytics: boolean;
  necessary: boolean;
}

function setConsentCookie(consent: CookieConsent): void {
  document.cookie = `${COOKIE_CONSENT_KEY}=${JSON.stringify(consent)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) {
      setVisible(true);
    }
  }, []);

  function accept() {
    const consent: CookieConsent = { analytics: true, necessary: true };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    setConsentCookie(consent);
    setVisible(false);
    // Reload so the analytics provider picks up the new consent
    window.location.reload();
  }

  function decline() {
    const consent: CookieConsent = { analytics: false, necessary: true };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    setConsentCookie(consent);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div role="dialog" aria-label="Cookie consent" className="fixed inset-x-0 bottom-0 z-50 p-4">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-lg border bg-background p-6 shadow-lg sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use cookies to improve your experience and analyze site usage. By accepting, you
          consent to analytics cookies.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={decline}>
            Decline
          </Button>
          <Button size="sm" onClick={accept}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
