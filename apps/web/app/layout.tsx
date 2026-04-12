import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { Providers } from '@/components/providers';
import { CookieConsentBanner } from '@/components/cookie-consent';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://example.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'FullStack Template',
    template: '%s | FullStack Template',
  },
  description:
    'A production-ready full-stack template with authentication, payments, email, and more.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'FullStack Template',
    title: 'FullStack Template',
    description:
      'A production-ready full-stack template with authentication, payments, email, and more.',
    images: [
      {
        url: `${BASE_URL}/api/og`,
        width: 1200,
        height: 630,
        alt: 'FullStack Template',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FullStack Template',
    description:
      'A production-ready full-stack template with authentication, payments, email, and more.',
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION ?? undefined,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers
          posthogKey={process.env.NEXT_PUBLIC_POSTHOG_KEY}
          posthogHost={process.env.NEXT_PUBLIC_POSTHOG_HOST}
        >
          {children}
        </Providers>
        <CookieConsentBanner />
      </body>
    </html>
  );
}
