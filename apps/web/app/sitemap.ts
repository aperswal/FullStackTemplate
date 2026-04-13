import type { MetadataRoute } from 'next';

import { env } from '@/lib/env';

const BASE_URL = env.NEXT_PUBLIC_APP_URL;
const HOME_PRIORITY = 1.0;
const DEFAULT_PRIORITY = 0.8;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ['/', '/pricing', '/login', '/signup'];

  return staticRoutes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date('2026-04-12'),
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? HOME_PRIORITY : DEFAULT_PRIORITY,
  }));
}
