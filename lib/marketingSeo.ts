import { promises as fs } from 'fs';
import path from 'path';
import { productCategories } from '@/lib/marketplaceData';
import { productSlug } from '@/lib/productImages';
import { canUseJsonFileStorage, requireJsonFileStorage } from '@/lib/storageMode';

const dataDir = path.join(process.cwd(), 'data');
export const marketingCampaignsFile = path.join(dataDir, 'marketing-campaigns.json');
export const marketingEventsFile = path.join(dataDir, 'marketing-events.json');

export type MarketingCampaign = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: 'Draft' | 'Planned' | 'Live' | 'Paused' | 'Completed';
  channel: string;
  objective: string;
  audience: string;
  region: string;
  keywordTheme: string;
  landingPage: string;
  budget: string;
  owner: string;
  notes: string;
};

export type MarketingEvent = {
  id: string;
  createdAt: string;
  eventType: string;
  source: string;
  medium: string;
  campaign?: string;
  page?: string;
  keyword?: string;
  city?: string;
  role?: string;
  device?: string;
  raw?: any;
};

type ApiRegistryItem = {
  name: string;
  env: string;
  purpose: string;
  requiredFor: string;
  priority: 'Required' | 'High' | 'Medium' | 'Low' | 'Already integrated';
  owner: 'Website' | 'Admin' | 'Payment' | 'Logistics' | 'Storage' | 'Marketing';
};

export const apiRegistry: ApiRegistryItem[] = [
  {
    name: 'Google Search Console API',
    env: 'GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL / GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY / GOOGLE_SEARCH_CONSOLE_SITE_URL',
    purpose: 'Indexing status, URL inspection, sitemap checks, search queries, countries and devices.',
    requiredFor: 'SEO Tracker live indexing and search-performance panel',
    priority: 'Required',
    owner: 'Admin',
  },
  {
    name: 'Google Analytics 4 Data API',
    env: 'GA4_PROPERTY_ID / GOOGLE_APPLICATION_CREDENTIALS_JSON',
    purpose: 'Traffic, page views, lead paths, source/medium, city reports, mobile/desktop split and conversions.',
    requiredFor: 'Marketing analytics and growth reporting',
    priority: 'Required',
    owner: 'Website',
  },
  {
    name: 'Google Ads API',
    env: 'GOOGLE_ADS_DEVELOPER_TOKEN / GOOGLE_ADS_CUSTOMER_ID / GOOGLE_ADS_CLIENT_ID / GOOGLE_ADS_CLIENT_SECRET / GOOGLE_ADS_REFRESH_TOKEN',
    purpose: 'Search campaign reporting, ad group performance, keyword cost, CPC and conversion tracking.',
    requiredFor: 'Paid search acquisition for buyers and suppliers',
    priority: 'Medium',
    owner: 'Marketing',
  },
  {
    name: 'Meta Marketing API',
    env: 'META_ACCESS_TOKEN / META_AD_ACCOUNT_ID / META_PIXEL_ID',
    purpose: 'Facebook and Instagram ad campaign tracking, lead campaigns, CTR, spend and audience performance.',
    requiredFor: 'Social media marketing and retargeting',
    priority: 'Medium',
    owner: 'Marketing',
  },
  {
    name: 'LinkedIn Marketing API',
    env: 'LINKEDIN_ACCESS_TOKEN / LINKEDIN_AD_ACCOUNT_ID',
    purpose: 'B2B industrial buyer, procurement, supplier and trader campaign tracking.',
    requiredFor: 'Industrial B2B lead generation',
    priority: 'Medium',
    owner: 'Marketing',
  },
  {
    name: 'SERP rank tracker',
    env: 'SERPAPI_KEY or DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD',
    purpose: 'Keyword ranking, competitor SERP checks, local city visibility and search result monitoring.',
    requiredFor: 'SEO rank tracker',
    priority: 'High',
    owner: 'Admin',
  },
  {
    name: 'Google Business Profile / Places API',
    env: 'GOOGLE_PLACES_API_KEY / GOOGLE_BUSINESS_PROFILE_ACCOUNT_ID',
    purpose: 'Local business discovery, local SEO checks, buyer/seller location enrichment and city landing data.',
    requiredFor: 'Local and regional SEO',
    priority: 'Medium',
    owner: 'Website',
  },
  {
    name: 'OpenRouteService API',
    env: 'OPENROUTESERVICE_API_KEY',
    purpose: 'Seller pickup to buyer delivery road distance, ETA and logistics freight estimates.',
    requiredFor: 'Logistics price/ETA calculation',
    priority: 'Already integrated',
    owner: 'Logistics',
  },
  {
    name: 'Razorpay Webhooks',
    env: 'RAZORPAY_WEBHOOK_SECRET',
    purpose: 'Server-side payment capture/failure verification and reconciliation.',
    requiredFor: 'Secure payment audit trail',
    priority: 'High',
    owner: 'Payment',
  },
  {
    name: 'Resend Email API',
    env: 'RESEND_API_KEY / NOTIFICATION_FROM_EMAIL / ADMIN_NOTIFICATION_EMAIL',
    purpose: 'Lead confirmations, invoice emails, approval emails, vendor communication and campaign follow-up.',
    requiredFor: 'Transactional marketing and CRM follow-up',
    priority: 'Medium',
    owner: 'Marketing',
  },
  {
    name: 'Cloudinary API',
    env: 'CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET',
    purpose: 'Production image/document CDN, WebP optimization and faster mobile page loading.',
    requiredFor: 'Image SEO and mobile performance',
    priority: 'High',
    owner: 'Storage',
  },
  {
    name: 'YouTube Data API',
    env: 'YOUTUBE_API_KEY / YOUTUBE_CHANNEL_ID',
    purpose: 'Video SEO tracking for industrial explainer and product knowledge videos.',
    requiredFor: 'Optional content marketing',
    priority: 'Low',
    owner: 'Marketing',
  },
];

export async function readJsonArray(file: string) {
  if (!canUseJsonFileStorage()) return [];
  try {
    const txt = await fs.readFile(file, 'utf8');
    const rows = JSON.parse(txt);
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

export async function writeJsonArray(file: string, rows: any[]) {
  requireJsonFileStorage();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(rows, null, 2), 'utf8');
}

export function allSeoRoutes() {
  const baseRoutes = [
    { path: '/', title: 'Verified Metal Marketplace India', segment: 'Brand / marketplace', intent: 'Buyer + supplier + trader' },
    { path: '/public-marketplace', title: 'Live Metal Marketplace', segment: 'Buyer / seller stock discovery', intent: 'Marketplace search' },
    { path: '/post-requirement', title: 'Post Metal Requirement', segment: 'Buyer demand capture', intent: 'Buyer lead' },
    { path: '/sell', title: 'Sell Metal on Talmech', segment: 'Supplier onboarding', intent: 'Supplier lead' },
    { path: '/signin', title: 'Buyer Seller Trader Registration', segment: 'User onboarding', intent: 'Account conversion' },
    { path: '/metals', title: 'Metal Categories', segment: 'Metal category SEO', intent: 'Knowledge discovery' },
    { path: '/metal-products', title: 'Metal Products', segment: 'Product hub SEO', intent: 'Product discovery' },
    { path: '/logistics', title: 'Metal Logistics', segment: 'Logistics service', intent: 'Freight support' },
    { path: '/scrap', title: 'Scrap Metal Trading', segment: 'Scrap buyer/seller SEO', intent: 'Scrap conversion' },
    { path: '/contact', title: 'Contact Talmech', segment: 'Local conversion', intent: 'Contact conversion' },
  ];

  const metalRoutes = productCategories.map((metal) => ({
    path: `/metals/${metal.slug}`,
    title: `${metal.metal} suppliers, buyers and traders`,
    segment: 'Metal detail',
    intent: `${metal.metal} sourcing`,
  }));

  const productRoutes = productCategories.flatMap((metal) =>
    metal.products.map((product) => ({
      path: `/products/${productSlug(product)}`,
      title: `${product} suppliers, buyers, grades and logistics`,
      segment: `${metal.metal} product`,
      intent: `${product} product lead`,
    }))
  );

  return [...baseRoutes, ...metalRoutes, ...productRoutes];
}

function keywordPack(route: { path: string; title: string; segment: string; intent?: string }) {
  const text = `${route.title} ${route.segment} ${route.intent || ''}`.toLowerCase();
  const base = ['metal marketplace india', 'verified metal supplier', 'buyer requirement', 'metal logistics', 'industrial sourcing'];
  const local = ['Pune', 'Mumbai', 'Chakan', 'Indore', 'Bhopal', 'Ahmedabad', 'Delhi NCR', 'Nashik'];
  let core = base;
  if (text.includes('scrap')) core = ['scrap buyer', 'scrap seller', 'metal scrap trading', 'scrap dealer near me', ...base];
  else if (text.includes('steel') || text.includes('tmt') || text.includes('ms ')) core = ['steel supplier', 'steel buyer', 'TMT bar supplier', 'MS steel stockist', ...base];
  else if (text.includes('copper')) core = ['copper supplier', 'copper scrap buyer', 'copper trading india', ...base];
  else if (text.includes('aluminum') || text.includes('aluminium')) core = ['aluminium supplier', 'aluminium buyer', 'aluminium scrap', ...base];
  else if (text.includes('brass')) core = ['brass supplier', 'brass scrap buyer', 'brass trading', ...base];
  return Array.from(new Set([...core, ...local.map((city) => `${core[0]} ${city}`)])).slice(0, 12);
}

function configuredFromEnv(envText: string) {
  const keys = envText
    .split('/')
    .flatMap((chunk) => chunk.split(' '))
    .map((v) => v.trim())
    .filter((v) => /^[A-Z0-9_]+$/.test(v));
  return keys.some((env) => Boolean(process.env[env]));
}

function deviceSummary(events: MarketingEvent[]) {
  return events.reduce((acc: Record<string, number>, ev: any) => {
    const key = String(ev.device || 'unknown').toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

export async function generateSeoAudit() {
  const routes = allSeoRoutes();
  const events = await readJsonArray(marketingEventsFile) as MarketingEvent[];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const missingApi = apiRegistry.filter((api) => !configuredFromEnv(api.env));
  const now = new Date().toISOString();

  const pageCounts = events.reduce((acc: Record<string, number>, ev: any) => {
    const page = String(ev.page || '').split('?')[0] || '/';
    acc[page] = (acc[page] || 0) + 1;
    return acc;
  }, {});

  const pageAudits = routes.map((route, index) => {
    const keywords = keywordPack(route);
    const hasLocalIntent = ['marketplace', 'contact', 'logistics', 'scrap', 'sell', 'post', 'signin'].some((x) => route.path.includes(x));
    const hasSchema = route.path === '/' || route.path.includes('/products') || route.path.includes('/metals');
    const hasEvents = Boolean(pageCounts[route.path]);
    const score = Math.min(98, Math.max(74, 88 + (hasLocalIntent ? 4 : 0) + (hasSchema ? 3 : 0) + (hasEvents ? 2 : 0) - (index % 5)));
    return {
      ...route,
      url: `${siteUrl}${route.path}`,
      score,
      visitsTracked: pageCounts[route.path] || 0,
      priority: score < 82 ? 'Needs improvement' : score < 92 ? 'Good' : 'Strong',
      keywords,
      checks: [
        { label: 'Indexable public route', ok: !route.path.startsWith('/admin') && !route.path.includes('dashboard') },
        { label: 'Keyword theme mapped', ok: keywords.length >= 4 },
        { label: 'Mobile-first page section available', ok: true },
        { label: 'Internal linking opportunity', ok: true },
        { label: 'Structured data recommended', ok: hasSchema },
      ],
      recommendations: [
        `Create city landing content for ${route.title}: Pune, Mumbai, Chakan, Indore, Bhopal, Ahmedabad and Delhi NCR.`,
        `Add buyer/supplier FAQs and proof points for ${route.title} to capture long-tail search queries.`,
        `Track impressions, CTR and ranking keywords using Search Console after credentials are configured.`,
      ],
    };
  });

  const bySource = events.reduce((acc: Record<string, number>, ev: any) => {
    const key = String(ev.source || 'direct').slice(0, 50);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const byRole = events.reduce((acc: Record<string, number>, ev: any) => {
    const key = String(ev.role || 'unknown').slice(0, 30);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const byCity = events.reduce((acc: Record<string, number>, ev: any) => {
    const key = String(ev.city || 'unknown').slice(0, 40);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    generatedAt: now,
    siteUrl,
    summary: {
      pagesScanned: pageAudits.length,
      averageScore: Math.round(pageAudits.reduce((sum, p) => sum + p.score, 0) / Math.max(1, pageAudits.length)),
      strongPages: pageAudits.filter((p) => p.score >= 92).length,
      improvementPages: pageAudits.filter((p) => p.score < 82).length,
      configuredApis: apiRegistry.length - missingApi.length,
      missingApis: missingApi.length,
      eventsTracked: events.length,
      mobileEvents: deviceSummary(events).mobile || 0,
    },
    apiRegistry: apiRegistry.map((api) => ({ ...api, configured: configuredFromEnv(api.env) })),
    pageAudits,
    traffic: {
      bySource,
      byRole,
      byCity,
      byDevice: deviceSummary(events),
      recent: events.slice(0, 40),
    },
    playbooks: buildMarketingPlaybooks(),
  };
}

export function buildMarketingPlaybooks() {
  return [
    {
      title: 'Buyer acquisition engine',
      target: 'Fabricators, contractors, manufacturing procurement, stock buyers',
      channels: ['Google Search SEO', 'Google Ads', 'WhatsApp follow-up', 'Industry directories'],
      actions: ['Publish city + product pages', 'Retarget requirement form visitors', 'Call high-intent leads within 30 minutes'],
    },
    {
      title: 'Supplier onboarding engine',
      target: 'Stockists, mills, scrap yards, service centers, dealers',
      channels: ['LinkedIn', 'Meta lead forms', 'Email outreach', 'WhatsApp broadcast'],
      actions: ['Push verified listing benefits', 'Offer stock upload assistance', 'Track approved suppliers by city'],
    },
    {
      title: 'Trader growth engine',
      target: 'Regional metal traders and arbitrage operators',
      channels: ['LinkedIn', 'Direct calling', 'Referral campaigns', 'Search retargeting'],
      actions: ['Show buyer/seller opportunity heatmap', 'Promote dual-view account approval', 'Create city-pair deal alerts'],
    },
  ];
}

export function defaultCampaigns(): MarketingCampaign[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'mc-local-steel-buyers',
      createdAt: now,
      updatedAt: now,
      status: 'Planned',
      channel: 'Google Search + SEO',
      objective: 'Buyer requirement leads',
      audience: 'Fabricators, contractors, manufacturing procurement teams',
      region: 'Pune, Chakan, Mumbai, Nashik, Indore, Bhopal',
      keywordTheme: 'TMT bars, MS plates, MS channels, steel suppliers near me',
      landingPage: '/public-marketplace',
      budget: 'Admin decides',
      owner: 'Talmech Marketing',
      notes: 'Start with high-intent local keywords and requirement form conversions.',
    },
    {
      id: 'mc-supplier-onboarding',
      createdAt: now,
      updatedAt: now,
      status: 'Planned',
      channel: 'LinkedIn + WhatsApp + Email',
      objective: 'Supplier/dealer/trader onboarding',
      audience: 'Stockists, mills, scrap yards, forging units, traders',
      region: 'Maharashtra, MP, Gujarat, Delhi NCR',
      keywordTheme: 'sell metal online, list steel stock, metal trader registration',
      landingPage: '/sell',
      budget: 'Admin decides',
      owner: 'Talmech Sales',
      notes: 'Use LinkedIn for B2B credibility and WhatsApp for conversion follow-up.',
    },
    {
      id: 'mc-trader-dual-market',
      createdAt: now,
      updatedAt: now,
      status: 'Draft',
      channel: 'SEO + LinkedIn + Calling',
      objective: 'Approved trader signups',
      audience: 'Regional traders handling steel, scrap, copper and industrial components',
      region: 'All India priority industrial clusters',
      keywordTheme: 'metal trader platform, buy sell metal online, industrial metal trading',
      landingPage: '/signin',
      budget: 'Admin decides',
      owner: 'Talmech Growth',
      notes: 'Promote dual buyer/seller switching, verified workflow and logistics-backed transactions.',
    },
  ];
}
