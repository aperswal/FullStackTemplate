import type { MetadataRoute } from 'next';

import { env } from '@/lib/env';

const BASE_URL = env.NEXT_PUBLIC_APP_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/mcp', '/.well-known/mcp.json'],
        disallow: ['/api/*', '/dashboard/*'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
