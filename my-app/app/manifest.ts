import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/', name: 'WYD Messenger', short_name: 'WYD',
    description: 'Connect across languages with QR, announcements and conversations.',
    start_url: '/', scope: '/', display: 'standalone',
    background_color: '#fffefb', theme_color: '#fffefb',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
