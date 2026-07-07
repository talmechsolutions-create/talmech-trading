import { findListingStrategyRule } from '@/data/listingStrategyRules';
import { hasListingImages, productImagesFromListing } from '@/lib/listingImages';

export type ListingQualitySignal = {
  field: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
};

export type ListingAdminAction =
  | 'Verified'
  | 'Needs photos'
  | 'Needs price confirmation'
  | 'Needs buyer outreach'
  | 'Matched with buyer'
  | 'Paused'
  | 'Sold/Fulfilled';

export type ListingStrategy = {
  listingId: string;
  strategyTitle: string;
  targetBuyerProfiles: string[];
  targetIndustries: string[];
  recommendedPitch: string;
  suggestedAdminActions: string[];
  urgencyScore: number;
  qualityScore: number;
  missingDataWarnings: string[];
  listingImprovementTips: string[];
  qualitySignals: ListingQualitySignal[];
  ruleKey: string;
};

export type ListingIntelligenceSummary = {
  overview: {
    totalListings: number;
    activeListings: number;
    inactiveListings: number;
    pendingReview: number;
    adminCreated: number;
    clientCreated: number;
    whatsappAssisted: number;
    publicSubmission: number;
    listingsWithImages: number;
    listingsMissingImages: number;
  };
  byMetal: Array<Record<string, any>>;
  byProduct: Array<Record<string, any>>;
  byRegion: Array<Record<string, any>>;
  attentionListings: Array<Record<string, any>>;
  listingStrategies: ListingStrategy[];
  generatedAt: string;
  mode: 'rules-based';
};

function value(row: any, key: string) {
  return row?.[key] ?? row?.raw?.[key] ?? '';
}

function clean(value: unknown, fallback = 'Unspecified') {
  const text = String(value || '').trim();
  return text || fallback;
}

function listingKind(row: any) {
  return clean(value(row, 'listingKind') || row.type, 'Unspecified');
}

function sourceBucket(row: any) {
  const source = String(value(row, 'source') || '').toLowerCase();
  if (source.includes('whatsapp')) return 'whatsapp-assisted';
  if (source.includes('manual-admin')) return 'admin-manual';
  if (source.includes('client')) return 'client-created';
  if (source.includes('public')) return 'public-submission';
  if (value(row, 'createdByAdmin')) return 'admin-manual';
  return 'unknown';
}

function isActive(row: any) {
  const status = String(row.status || value(row, 'listingApprovalStatus') || '').toLowerCase();
  const visibility = String(value(row, 'listingVisibility') || 'public').toLowerCase();
  if (visibility === 'draft' || visibility === 'private') return false;
  return !/(pending|draft|inactive|paused|sold|fulfilled|closed|rejected)/i.test(status);
}

function isPending(row: any) {
  return /pending|draft|needs/i.test(String(row.status || value(row, 'listingApprovalStatus') || ''));
}

function parseQuantity(row: any) {
  const raw = String(row.quantity || value(row, 'quantity') || '').replace(/,/g, '');
  const match = raw.match(/\d+(?:\.\d+)?/);
  if (!match) return 0;
  const amount = Number(match[0]);
  if (!Number.isFinite(amount)) return 0;
  const unit = String(row.unit || value(row, 'quantityUnit') || '').toLowerCase();
  if (unit.includes('mt') || unit.includes('ton')) return amount * 1000;
  return amount;
}

function addCount(map: Map<string, number>, key: string, count = 1) {
  map.set(key, (map.get(key) || 0) + count);
}

function topEntries(map: Map<string, number>, limit = 4) {
  return [...map.entries()]
    .filter(([key]) => key && key !== 'Unspecified')
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key]) => key);
}

function buyerSellerMix(rows: any[]) {
  const buyer = rows.filter((row) => String(row.type || '').toUpperCase() === 'BUY' || /buy/i.test(listingKind(row))).length;
  const seller = rows.filter((row) => ['SELL', 'SCRAP'].includes(String(row.type || '').toUpperCase()) || /sell|scrap|trader/i.test(listingKind(row))).length;
  if (!buyer && !seller) return 'Insufficient data';
  if (buyer && seller) return `${buyer} buy / ${seller} supply`;
  if (buyer) return `${buyer} buy requirement${buyer === 1 ? '' : 's'} / no supply listings`;
  return `No buy requirements / ${seller} supply listing${seller === 1 ? '' : 's'}`;
}

function imbalance(rows: any[]) {
  const buyer = rows.filter((row) => String(row.type || '').toUpperCase() === 'BUY' || /buy/i.test(listingKind(row))).length;
  const seller = rows.length - buyer;
  if (!rows.length) return 'Insufficient data';
  if (buyer >= seller * 2 && buyer > 1) return 'Demand-heavy: prioritize supplier outreach.';
  if (seller >= buyer * 2 && seller > 1) return 'Supply-heavy: prioritize buyer outreach.';
  return 'Balanced or insufficient sample: continue admin verification.';
}

function missingSignals(row: any) {
  const signals: ListingQualitySignal[] = [];
  const images = hasListingImages(row);
  const checks = [
    ['quantity', row.quantity || value(row, 'quantity'), 'Quantity is missing.'],
    ['price', row.targetPrice || row.priceType || value(row, 'price') || value(row, 'targetPrice'), 'Price or target price is missing.'],
    ['grade', row.grade || value(row, 'grade'), 'Grade is missing.'],
    ['region', row.city || row.state || value(row, 'city') || value(row, 'state'), 'City/state is missing.'],
    ['owner', value(row, 'accountId') || value(row, 'ownerUserId'), 'Owner account is not linked.'],
  ] as const;
  checks.forEach(([field, data, message]) => {
    if (!data) signals.push({ field, severity: field === 'owner' ? 'critical' : 'warning', message });
  });
  if (!images) signals.push({ field: 'images', severity: 'warning', message: 'Product images are missing.' });
  if (!isActive(row)) signals.push({ field: 'status', severity: 'info', message: 'Listing is inactive, draft, pending, paused or closed.' });
  return signals;
}

export function generateListingStrategy(row: any): ListingStrategy {
  const metal = clean(row.metal || value(row, 'metal'));
  const product = clean(row.product || value(row, 'product'));
  const grade = clean(row.grade || value(row, 'grade'), '');
  const region = [row.city || value(row, 'city'), row.state || value(row, 'state')].filter(Boolean).join(', ') || 'region not verified';
  const type = listingKind(row);
  const rule = findListingStrategyRule(metal, product);
  const signals = missingSignals(row);
  const missingDataWarnings = signals.map((signal) => signal.message);
  const scorePenalty = signals.reduce((sum, signal) => sum + (signal.severity === 'critical' ? 18 : signal.severity === 'warning' ? 10 : 5), 0);
  const qualityScore = Math.max(10, 100 - scorePenalty);
  const urgencyScore = Math.max(15, Math.min(95, (isActive(row) ? 58 : 35) + (String(row.type).toUpperCase() === 'BUY' ? 15 : 0) + (qualityScore < 70 ? 8 : 0)));
  const productLabel = [metal, product, grade].filter(Boolean).join(' ');

  const adminActions = [
    ...signals.filter((signal) => signal.severity !== 'info').map((signal) => signal.message.replace(' is missing.', '').replace('.', '')),
    ...rule.adminActions,
  ].slice(0, 6);

  return {
    listingId: row.id,
    strategyTitle: `${type} supervision for ${productLabel || row.id}`,
    targetBuyerProfiles: rule.targetBuyerProfiles,
    targetIndustries: rule.targetIndustries,
    recommendedPitch: `${rule.positioning} Current region: ${region}. ${missingDataWarnings.length ? 'Needs admin verification before outreach.' : 'Ready for targeted outreach after final commercial check.'}`,
    suggestedAdminActions: adminActions.length ? adminActions : ['review listing details', 'confirm buyer/seller fit', 'prepare outreach list'],
    urgencyScore,
    qualityScore,
    missingDataWarnings,
    listingImprovementTips: [
      ...rule.verificationChecks.map((check) => check.charAt(0).toUpperCase() + check.slice(1)),
      'Listings with clear product photos get better buyer response.',
    ].slice(0, 6),
    qualitySignals: signals,
    ruleKey: rule.key,
  };
}

function summarizeMetal(metal: string, rows: any[]) {
  const products = new Map<string, number>();
  const grades = new Map<string, number>();
  const regions = new Map<string, number>();
  rows.forEach((row) => {
    addCount(products, clean(row.product || value(row, 'product')));
    addCount(grades, clean(row.grade || value(row, 'grade')));
    addCount(regions, [row.city || value(row, 'city'), row.state || value(row, 'state')].filter(Boolean).join(', ') || 'Unspecified');
  });
  return {
    metal,
    totalListings: rows.length,
    activeListings: rows.filter(isActive).length,
    totalQuantityKg: rows.reduce((sum, row) => sum + parseQuantity(row), 0),
    topProducts: topEntries(products),
    topGrades: topEntries(grades),
    topRegions: topEntries(regions),
    buyerSellerMix: buyerSellerMix(rows),
    demandSupplyIndicator: imbalance(rows),
    recommendedAction: imbalance(rows),
  };
}

function summarizeProduct(key: string, rows: any[]) {
  const regions = new Map<string, number>();
  rows.forEach((row) => addCount(regions, [row.city || value(row, 'city'), row.state || value(row, 'state')].filter(Boolean).join(', ') || 'Unspecified'));
  const sample = rows[0] || {};
  const strategy = generateListingStrategy(sample);
  return {
    product: key,
    metal: clean(sample.metal || value(sample, 'metal')),
    totalListings: rows.length,
    activeListings: rows.filter(isActive).length,
    regions: topEntries(regions, 6),
    relatedBuyerIndustries: strategy.targetIndustries,
    likelyBuyerTypes: strategy.targetBuyerProfiles,
    suggestedOutreachStrategy: strategy.recommendedPitch,
    suggestedKeywords: findListingStrategyRule(sample.metal, sample.product).suggestedKeywords,
    suggestedNextAction: strategy.suggestedAdminActions[0] || 'Needs admin verification',
  };
}

function summarizeRegion(region: string, rows: any[]) {
  const metals = new Map<string, number>();
  const products = new Map<string, number>();
  rows.forEach((row) => {
    addCount(metals, clean(row.metal || value(row, 'metal')));
    addCount(products, clean(row.product || value(row, 'product')));
  });
  return {
    region,
    totalListings: rows.length,
    activeListings: rows.filter(isActive).length,
    metals: topEntries(metals, 6),
    products: topEntries(products, 6),
    buyerSellerMix: buyerSellerMix(rows),
    opportunityNotes: imbalance(rows),
  };
}

function groupBy(rows: any[], keyFor: (row: any) => string) {
  const groups = new Map<string, any[]>();
  rows.forEach((row) => {
    const key = clean(keyFor(row));
    groups.set(key, [...(groups.get(key) || []), row]);
  });
  return groups;
}

export function analyzeListings(listings: any[]): ListingIntelligenceSummary {
  const realRows = listings.filter((row) => !row.demo);
  const strategies = realRows.map(generateListingStrategy);
  const strategyById = new Map(strategies.map((strategy) => [strategy.listingId, strategy]));
  const byMetalGroups = groupBy(realRows, (row) => row.metal || value(row, 'metal'));
  const byProductGroups = groupBy(realRows, (row) => row.product || value(row, 'product'));
  const byRegionGroups = groupBy(realRows, (row) => [row.city || value(row, 'city'), row.state || value(row, 'state')].filter(Boolean).join(', ') || 'Unspecified');

  return {
    overview: {
      totalListings: realRows.length,
      activeListings: realRows.filter(isActive).length,
      inactiveListings: realRows.filter((row) => !isActive(row)).length,
      pendingReview: realRows.filter(isPending).length,
      adminCreated: realRows.filter((row) => sourceBucket(row) === 'admin-manual' || value(row, 'createdByAdmin')).length,
      clientCreated: realRows.filter((row) => sourceBucket(row) === 'client-created').length,
      whatsappAssisted: realRows.filter((row) => sourceBucket(row) === 'whatsapp-assisted').length,
      publicSubmission: realRows.filter((row) => sourceBucket(row) === 'public-submission').length,
      listingsWithImages: realRows.filter(hasListingImages).length,
      listingsMissingImages: realRows.filter((row) => !hasListingImages(row)).length,
    },
    byMetal: [...byMetalGroups.entries()].map(([metal, rows]) => summarizeMetal(metal, rows)).sort((a, b) => b.totalListings - a.totalListings),
    byProduct: [...byProductGroups.entries()].map(([product, rows]) => summarizeProduct(product, rows)).sort((a, b) => b.totalListings - a.totalListings),
    byRegion: [...byRegionGroups.entries()].map(([region, rows]) => summarizeRegion(region, rows)).sort((a, b) => b.totalListings - a.totalListings),
    attentionListings: realRows
      .map((row) => ({ listing: row, strategy: strategyById.get(row.id), images: productImagesFromListing(row) }))
      .filter((item) => item.strategy && (item.strategy.missingDataWarnings.length > 0 || item.strategy.qualityScore < 75))
      .sort((a, b) => (a.strategy?.qualityScore || 0) - (b.strategy?.qualityScore || 0))
      .slice(0, 40),
    listingStrategies: strategies,
    generatedAt: new Date().toISOString(),
    mode: 'rules-based',
  };
}
