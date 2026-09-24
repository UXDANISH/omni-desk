import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

// The portal holds patient information, so only the public sign-in page is crawlable.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: ['/login'], disallow: ['/'] }],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
