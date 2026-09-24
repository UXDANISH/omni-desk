import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE.url}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 }];
}
