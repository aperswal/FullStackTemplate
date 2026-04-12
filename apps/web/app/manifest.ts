import type { MetadataRoute } from 'next';

import messages from '@/messages/en.json';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: messages.manifest.name,
    short_name: messages.manifest.shortName,
    description: messages.manifest.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
