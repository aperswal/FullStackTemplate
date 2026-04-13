/** Provider-agnostic consent check. Reads from localStorage so any analytics provider can use it. */

export const COOKIE_CONSENT_KEY = 'cookie-consent';

export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored === null) {
      return false;
    }
    const parsed = JSON.parse(stored) as { analytics?: boolean };
    return parsed.analytics === true;
  } catch {
    return false;
  }
}
