import { getRequestConfig } from 'next-intl/server';

import config from '../i18n.config.json';

const supportedLocales = [config.sourceLocale, ...config.targetLocales];

export default getRequestConfig(async () => {
  // Single-locale mode for now. When adding locale detection (cookie, header,
  // URL prefix), resolve the locale here and validate against supportedLocales.
  const locale = config.sourceLocale;

  if (!supportedLocales.includes(locale)) {
    return {
      locale: config.sourceLocale,
      messages: (await import(`../messages/${config.sourceLocale}.json`)).default,
    };
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
