export const siteSeoConfig = {
  siteName: 'Talmech Trading',
  defaultTitle: 'Talmech Trading - Metal Marketplace, Logistics and Industrial Services',
  defaultDescription:
    'Talmech Trading helps Indian industrial buyers and sellers coordinate metal sourcing, public requirements, logistics, manpower services, and manufacturing intelligence.',
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://talmechtrading.in',
  organization: {
    name: 'Talmech Trading',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://talmechtrading.in',
    contactPoint: '+91 7389642874',
    areaServed: 'India',
  },
  publicRoutes: [
    '/',
    '/public-marketplace',
    '/marketplace',
    '/post-requirement',
    '/sell',
    '/signin',
    '/contact',
    '/how-it-works',
    '/manpower-services',
    '/whatsapp-upload',
    '/metals',
    '/metal-products',
    '/scrap',
    '/logistics',
    '/tmis',
    '/manufacturing-intelligence',
  ],
  privateRoutePrefixes: [
    '/admin',
    '/admin-',
    '/account',
    '/api',
    '/dashboard',
    '/crm',
    '/analytics',
    '/invoices',
    '/seo-tracker',
  ],
};

export function canonicalUrl(path = '/') {
  const base = siteSeoConfig.baseUrl.replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function isPrivateSeoPath(pathname: string) {
  return siteSeoConfig.privateRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`) || pathname.startsWith(prefix));
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteSeoConfig.organization.name,
    url: siteSeoConfig.organization.url,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: siteSeoConfig.organization.contactPoint,
      contactType: 'customer support',
      areaServed: siteSeoConfig.organization.areaServed,
    },
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteSeoConfig.siteName,
    url: siteSeoConfig.baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteSeoConfig.baseUrl.replace(/\/$/, '')}/public-marketplace?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}
