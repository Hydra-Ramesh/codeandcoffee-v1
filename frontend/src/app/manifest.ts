import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Code & Coffee — Learn, Practice, Read, Apply',
    short_name: 'Code & Coffee',
    description:
      'A high-performance publication and interactive practice arena for distributed systems, database engineering, and modern algorithm craftsmanship.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0d14',
    theme_color: '#f59e0b',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
