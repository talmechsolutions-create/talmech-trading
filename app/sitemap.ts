import type { MetadataRoute } from 'next';
import { productCategories } from '@/lib/marketplaceData';
import { productSlug } from '@/lib/productImages';
import { tmisPublicRoutes } from '@/data/tmis';
import { siteSeoConfig } from '@/lib/seo/siteSeoConfig';
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteSeoConfig.baseUrl;
  const now = new Date();
  const publicRoutes = siteSeoConfig.publicRoutes.map((route) => route === '/' ? '' : route);
  const metalPages = productCategories.map(m => ({ url: `${base}/metals/${m.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: .88 }));
  const productPages = productCategories.flatMap(m => m.products.map(p => ({ url: `${base}/products/${productSlug(p)}`, lastModified: now, changeFrequency: 'weekly' as const, priority: .8 })));
  const tmisPages = tmisPublicRoutes.map(route => ({ url: `${base}${route.path}`, lastModified: now, changeFrequency: 'weekly' as const, priority: .7 }));
  return [
    ...publicRoutes.map(route => ({ url: `${base}${route}`, lastModified: now, changeFrequency: route === '' ? 'daily' as const : 'weekly' as const, priority: route === '' ? 1 : .82 })),
    ...metalPages,
    ...productPages,
    ...tmisPages
  ];
}
