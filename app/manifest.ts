import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} Portal`,
    short_name: SITE.name,
    description: SITE.description,
    start_url: '/overview',
    display: 'standalone',
    background_color: '#F6F8F9',
    theme_color: '#08090B',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
