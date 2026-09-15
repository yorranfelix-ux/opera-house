import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Opera House ERP',
    short_name: 'Opera House',
    description: 'Sistema operacional Opera House',
    start_url: '/pedidos',
    display: 'standalone',
    background_color: '#f7f6f3',
    theme_color: '#1a1a2e',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
