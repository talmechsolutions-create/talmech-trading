import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://talmech-trading.vercel.app';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/public-marketplace', '/post-requirement', '/sell', '/signin', '/contact', '/how-it-works', '/metals', '/metal-products', '/products', '/materials', '/grades', '/quality', '/marketplace', '/rfq', '/scrap', '/logistics', '/tmis', '/manufacturing-intelligence'],
        disallow: ['/dashboard', '/crm', '/admin', '/admin/tmis', '/admin-tmis', '/admin-login', '/admin-leads', '/admin-users', '/admin-price-locks', '/admin-logistics', '/seo-tracker', '/supplier-search', '/industry-search', '/strategy', '/knowledge', '/small-deals', '/analytics', '/invoices', '/api'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
