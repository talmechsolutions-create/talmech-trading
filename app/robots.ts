import type { MetadataRoute } from 'next';
import { siteSeoConfig } from '@/lib/seo/siteSeoConfig';

export default function robots(): MetadataRoute.Robots {
  const base = siteSeoConfig.baseUrl;
  return {
    rules: [
      {
        userAgent: '*',
        allow: siteSeoConfig.publicRoutes,
        disallow: [
          '/dashboard',
          '/crm',
          '/admin',
          '/admin/',
          '/admin-',
          '/admin-login',
          '/account',
          '/account/',
          '/seo-tracker',
          '/supplier-search',
          '/industry-search',
          '/strategy',
          '/knowledge',
          '/small-deals',
          '/analytics',
          '/invoices',
          '/api',
          '/api/',
          '/internal',
          '/internal/',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
