import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

import { Providers } from '@/components/providers';
import { CookieConsentBanner } from '@/components/cookie-consent';
import { Toaster } from '@/components/ui/sonner';
import { env } from '@/lib/env';
import messages from '@/messages/en.json';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const BASE_URL = env.NEXT_PUBLIC_APP_URL;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: messages.seo.siteName,
    template: `%s | ${messages.seo.siteName}`,
  },
  description: messages.seo.defaultDescription,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: messages.seo.siteName,
    title: messages.seo.siteName,
    description: messages.seo.defaultDescription,
    images: [
      {
        url: `${BASE_URL}/api/og`,
        width: 1200,
        height: 630,
        alt: messages.seo.siteName,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: messages.seo.siteName,
    description: messages.seo.defaultDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: env.GOOGLE_SITE_VERIFICATION ?? undefined,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.ReactNode> {
  const locale = await getLocale();
  const intlMessages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider messages={intlMessages}>
          <Providers
            posthogKey={env.NEXT_PUBLIC_POSTHOG_KEY}
            posthogHost={env.NEXT_PUBLIC_POSTHOG_HOST}
          >
            {children}
          </Providers>
          <CookieConsentBanner />
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
