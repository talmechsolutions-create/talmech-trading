export const industrialPageSizeOptions = [25, 50, 100] as const;
export const industrialMaxPageSize = 100;
export const industrialDefaultPageSize = 25;

export const industrialIndustryValues = ['FORGING', 'STEEL', 'OTHER_MANUFACTURING'] as const;
export const industrialVerificationValues = [
  'UNVERIFIED',
  'DISCOVERY_ONLY',
  'SOURCE_CAPTURED',
  'AUTO_NORMALIZED',
  'NEEDS_REVIEW',
  'ASSOCIATION_VERIFIED',
  'REGULATORY_VERIFIED',
  'OFFICIAL_VERIFIED',
  'MANUALLY_VERIFIED',
  'PARTIALLY_VERIFIED',
  'VERIFIED',
  'CONFLICTING',
  'STALE',
  'REJECTED',
] as const;
export const industrialPriorityValues = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export const industrialLifecycleValues = [
  'DISCOVERED',
  'VERIFICATION_PENDING',
  'VERIFIED',
  'QUALIFIED',
  'OUTREACH_READY',
  'CONTACTED',
  'ENGAGED',
  'CRM_PROMOTED',
  'OPPORTUNITY',
  'QUOTATION',
  'CUSTOMER',
  'DISQUALIFIED',
] as const;
export const industrialServiceValues = [
  'MPI_NDT',
  'VISUAL_INSPECTION',
  'GRINDING',
  'FETTLING',
  'SORTING',
  'SEGREGATION',
  'REWORK',
  'OILING',
  'PACKING',
  'MATERIAL_HANDLING',
  'PRODUCTION_SUPPORT',
  'QUALITY_CONTAINMENT',
  'MANAGED_MANPOWER',
  'OTHER_INDUSTRIAL_SERVICES',
] as const;

const activeStatusValues = ['active', 'inactive', 'all'] as const;
const companySortValues = ['updatedAt', 'createdAt', 'opportunityScore', 'canonicalName'] as const;
const contactSortValues = ['updatedAt', 'createdAt', 'personName'] as const;
const sortDirectionValues = ['asc', 'desc'] as const;

export type IndustrialCompanyFilters = {
  page: number;
  limit: number;
  search: string;
  region: string;
  state: string;
  industry: string;
  subcategory: string;
  verificationStatus: string;
  priority: string;
  lifecycleStatus: string;
  researchStatus: string;
  activeStatus: 'active' | 'inactive' | 'all';
  sort: (typeof companySortValues)[number];
  direction: (typeof sortDirectionValues)[number];
};

export type IndustrialContactFilters = {
  page: number;
  limit: number;
  search: string;
  companyId: string;
  plantId: string;
  state: string;
  department: string;
  verificationStatus: string;
  sort: (typeof contactSortValues)[number];
  direction: (typeof sortDirectionValues)[number];
};

function paramValue(params: URLSearchParams, key: string) {
  return String(params.get(key) || '').trim();
}

function cleanText(value: string, max = 120) {
  return value.replace(/[\u0000-\u001f<>]/g, '').slice(0, max).trim();
}

function pageNumber(value: string) {
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page) && page > 0 ? Math.min(page, 10000) : 1;
}

export function parseIndustrialLimit(value: string | null | undefined) {
  const parsed = Number.parseInt(String(value || ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return industrialDefaultPageSize;
  return Math.min(parsed, industrialMaxPageSize);
}

function allowedValue<T extends readonly string[]>(value: string, allowed: T): T[number] | '' {
  return allowed.includes(value as T[number]) ? (value as T[number]) : '';
}

function allowedText(value: string, max = 80) {
  return cleanText(value, max);
}

export function parseIndustrialCompanyFilters(params: URLSearchParams): IndustrialCompanyFilters {
  return {
    page: pageNumber(paramValue(params, 'page')),
    limit: parseIndustrialLimit(params.get('limit')),
    search: cleanText(paramValue(params, 'search'), 120),
    region: allowedText(paramValue(params, 'region')),
    state: allowedText(paramValue(params, 'state')),
    industry: allowedValue(paramValue(params, 'industry'), industrialIndustryValues),
    subcategory: allowedText(paramValue(params, 'subcategory')),
    verificationStatus: allowedValue(paramValue(params, 'verificationStatus'), industrialVerificationValues),
    priority: allowedValue(paramValue(params, 'priority'), industrialPriorityValues),
    lifecycleStatus: allowedValue(paramValue(params, 'lifecycleStatus'), industrialLifecycleValues),
    researchStatus: allowedText(paramValue(params, 'researchStatus'), 60),
    activeStatus: allowedValue(paramValue(params, 'activeStatus'), activeStatusValues) || 'active',
    sort: allowedValue(paramValue(params, 'sort'), companySortValues) || 'updatedAt',
    direction: allowedValue(paramValue(params, 'direction'), sortDirectionValues) || 'desc',
  };
}

export function parseIndustrialContactFilters(params: URLSearchParams): IndustrialContactFilters {
  return {
    page: pageNumber(paramValue(params, 'page')),
    limit: parseIndustrialLimit(params.get('limit')),
    search: cleanText(paramValue(params, 'search'), 120),
    companyId: cleanText(paramValue(params, 'companyId'), 120),
    plantId: cleanText(paramValue(params, 'plantId'), 120),
    state: allowedText(paramValue(params, 'state')),
    department: allowedText(paramValue(params, 'department')),
    verificationStatus: allowedValue(paramValue(params, 'verificationStatus'), industrialVerificationValues),
    sort: allowedValue(paramValue(params, 'sort'), contactSortValues) || 'updatedAt',
    direction: allowedValue(paramValue(params, 'direction'), sortDirectionValues) || 'desc',
  };
}

export function industrialOffset(page: number, limit: number) {
  return (Math.max(1, page) - 1) * Math.min(Math.max(1, limit), industrialMaxPageSize);
}

export function industrialPaginationMeta(total: number, page: number, limit: number) {
  const safeLimit = Math.min(Math.max(1, limit), industrialMaxPageSize);
  const safePage = Math.max(1, page);
  return {
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    hasNextPage: safePage * safeLimit < total,
    hasPreviousPage: safePage > 1,
  };
}
