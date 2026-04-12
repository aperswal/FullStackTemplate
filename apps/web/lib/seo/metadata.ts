import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://example.com';

interface PageMetadataInput {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export function createMetadata({
  title,
  description,
  path = '',
  ogImage,
  noIndex = false,
}: PageMetadataInput): Metadata {
  const url = `${BASE_URL}${path}`;
  const image = ogImage ?? `${BASE_URL}/api/og?title=${encodeURIComponent(title)}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'FullStack Template',
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}
