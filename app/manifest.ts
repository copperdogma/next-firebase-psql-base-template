import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: process.env.NEXT_PUBLIC_APP_NAME || '{{YOUR_APP_TITLE}}',
    short_name: process.env.NEXT_PUBLIC_APP_SHORT_NAME || '{{YOUR_APP_SHORT_NAME}}',
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || '{{YOUR_PROJECT_DESCRIPTION}}',
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
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
