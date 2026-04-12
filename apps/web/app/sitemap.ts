import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://example.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ['/', '/pricing', '/login', '/signup'];

  return staticRoutes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1.0 : 0.8,
  }));
}
