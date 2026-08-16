import {
  IndustrialIndustryCategory,
  IndustrialLifecycleStatus,
  IndustrialPriority,
  IndustrialVerificationStatus,
  Prisma,
} from '@prisma/client';
import { prisma, hasDatabaseConnection } from '@/lib/proDb';
import {
  IndustrialCompanyFilters,
  IndustrialContactFilters,
  industrialOffset,
  industrialPaginationMeta,
} from '@/lib/industrialIntelligenceQuery';

export type IndustrialReadResult<T> = {
  data: T;
  schemaReady: boolean;
};

type RegionRow = {
  region: string | null;
  state: string | null;
  company_count: bigint;
  plant_count: bigint;
  contact_count: bigint;
};

const companyListSelect = {
  id: true,
  canonicalName: true,
  displayName: true,
  legalName: true,
  officialDomain: true,
  industryCategory: true,
  subcategories: true,
  region: true,
  state: true,
  city: true,
  verificationStatus: true,
  lifecycleStatus: true,
  researchStatus: true,
  priority: true,
  opportunityScore: true,
  updatedAt: true,
  isActive: true,
  _count: {
    select: {
      plants: true,
      contacts: true,
      serviceOpportunities: true,
    },
  },
} satisfies Prisma.IndustrialCompanySelect;

const contactListSelect = {
  id: true,
  personName: true,
  designation: true,
  department: true,
  phone: true,
  email: true,
  verificationStatus: true,
  contactScope: true,
  updatedAt: true,
  company: {
    select: {
      id: true,
      canonicalName: true,
      state: true,
      city: true,
    },
  },
  plant: {
    select: {
      id: true,
      plantName: true,
      state: true,
      city: true,
    },
  },
} satisfies Prisma.IndustrialContactSelect;

function schemaNotReady(error: unknown) {
  const code = error && typeof error === 'object' ? String((error as { code?: unknown }).code || '') : '';
  return ['P2021', 'P2022'].includes(code);
}

async function industrialRead<T>(fallback: T, loader: () => Promise<T>): Promise<IndustrialReadResult<T>> {
  if (!hasDatabaseConnection()) return { data: fallback, schemaReady: false };
  try {
    return { data: await loader(), schemaReady: true };
  } catch (error) {
    if (schemaNotReady(error)) return { data: fallback, schemaReady: false };
    throw error;
  }
}

function contains(value: string) {
  return { contains: value, mode: Prisma.QueryMode.insensitive };
}

function companyWhere(filters: IndustrialCompanyFilters): Prisma.IndustrialCompanyWhereInput {
  const where: Prisma.IndustrialCompanyWhereInput = {};

  if (filters.search) {
    where.OR = [
      { canonicalName: contains(filters.search) },
      { displayName: contains(filters.search) },
      { legalName: contains(filters.search) },
      { normalizedName: contains(filters.search.toLowerCase()) },
      { officialWebsite: contains(filters.search) },
      { officialDomain: contains(filters.search.toLowerCase()) },
      { gstin: contains(filters.search.toUpperCase()) },
    ];
  }
  if (filters.region) where.region = { equals: filters.region, mode: Prisma.QueryMode.insensitive };
  if (filters.state) where.state = { equals: filters.state, mode: Prisma.QueryMode.insensitive };
  if (filters.industry) where.industryCategory = filters.industry as IndustrialIndustryCategory;
  if (filters.subcategory) where.subcategories = { array_contains: filters.subcategory };
  if (filters.verificationStatus) where.verificationStatus = filters.verificationStatus as IndustrialVerificationStatus;
  if (filters.priority) where.priority = filters.priority as IndustrialPriority;
  if (filters.lifecycleStatus) where.lifecycleStatus = filters.lifecycleStatus as IndustrialLifecycleStatus;
  if (filters.researchStatus) where.researchStatus = { equals: filters.researchStatus, mode: Prisma.QueryMode.insensitive };
  if (filters.activeStatus !== 'all') where.isActive = filters.activeStatus === 'active';

  return where;
}

function contactWhere(filters: IndustrialContactFilters): Prisma.IndustrialContactWhereInput {
  const where: Prisma.IndustrialContactWhereInput = {};
  if (filters.companyId) where.companyId = filters.companyId;
  if (filters.plantId) where.plantId = filters.plantId;
  if (filters.department) where.department = { equals: filters.department, mode: Prisma.QueryMode.insensitive };
  if (filters.verificationStatus) where.verificationStatus = filters.verificationStatus as IndustrialVerificationStatus;
  if (filters.state) {
    where.OR = [
      { company: { state: { equals: filters.state, mode: Prisma.QueryMode.insensitive } } },
      { plant: { state: { equals: filters.state, mode: Prisma.QueryMode.insensitive } } },
    ];
  }
  if (filters.search) {
    const searchOr: Prisma.IndustrialContactWhereInput[] = [
      { personName: contains(filters.search) },
      { normalizedPersonName: contains(filters.search.toLowerCase()) },
      { designation: contains(filters.search) },
      { company: { canonicalName: contains(filters.search) } },
    ];
    where.AND = [...(Array.isArray(where.AND) ? where.AND : []), { OR: searchOr }];
  }
  return where;
}

export async function getIndustrialSummary() {
  return industrialRead(
    {
      metrics: {
        totalCompanies: 0,
        totalPlants: 0,
        totalContacts: 0,
        verifiedCompanies: 0,
        verificationPending: 0,
        forgingCompanies: 0,
        steelCompanies: 0,
        highPriorityCompanies: 0,
        topScoringProspects: 0,
        existingContactCoverage: 0,
      },
      regionAnalytics: [] as Array<{ region: string; state: string; companyCount: number; plantCount: number; contactCount: number }>,
      serviceAnalytics: [] as Array<{ serviceType: string; count: number }>,
      verificationAnalytics: [] as Array<{ verificationStatus: string; count: number }>,
    },
    async () => {
      const [
        totalCompanies,
        totalPlants,
        totalContacts,
        verifiedCompanies,
        verificationPending,
        forgingCompanies,
        steelCompanies,
        highPriorityCompanies,
        topScoringProspects,
        companiesWithContacts,
        regionRows,
        serviceGroups,
        verificationGroups,
      ] = await prisma.$transaction([
        prisma.industrialCompany.count(),
        prisma.industrialPlant.count(),
        prisma.industrialContact.count(),
        prisma.industrialCompany.count({ where: { verificationStatus: 'VERIFIED' } }),
        prisma.industrialCompany.count({ where: { verificationStatus: { in: ['UNVERIFIED', 'DISCOVERY_ONLY', 'SOURCE_CAPTURED', 'AUTO_NORMALIZED', 'NEEDS_REVIEW', 'PARTIALLY_VERIFIED'] } } }),
        prisma.industrialCompany.count({ where: { industryCategory: 'FORGING' } }),
        prisma.industrialCompany.count({ where: { industryCategory: 'STEEL' } }),
        prisma.industrialCompany.count({ where: { priority: { in: ['HIGH', 'CRITICAL'] } } }),
        prisma.industrialCompany.count({ where: { opportunityScore: { gte: 80 } } }),
        prisma.industrialCompany.count({ where: { contacts: { some: {} } } }),
        prisma.$queryRaw<RegionRow[]>`
          SELECT
            COALESCE(c."region", p."region") AS region,
            COALESCE(c."state", p."state") AS state,
            COUNT(DISTINCT c."id") AS company_count,
            COUNT(DISTINCT p."id") AS plant_count,
            COUNT(DISTINCT ic."id") AS contact_count
          FROM "IndustrialCompany" c
          FULL OUTER JOIN "IndustrialPlant" p ON p."companyId" = c."id"
          LEFT JOIN "IndustrialContact" ic ON ic."companyId" = c."id"
          GROUP BY COALESCE(c."region", p."region"), COALESCE(c."state", p."state")
          ORDER BY company_count DESC, plant_count DESC
          LIMIT 25
        `,
        prisma.industrialServiceOpportunity.groupBy({ by: ['serviceType'], _count: true, orderBy: { _count: { serviceType: 'desc' } }, take: 25 }),
        prisma.industrialCompany.groupBy({ by: ['verificationStatus'], _count: true, orderBy: { _count: { verificationStatus: 'desc' } } }),
      ]);

      return {
        metrics: {
          totalCompanies,
          totalPlants,
          totalContacts,
          verifiedCompanies,
          verificationPending,
          forgingCompanies,
          steelCompanies,
          highPriorityCompanies,
          topScoringProspects,
          existingContactCoverage: totalCompanies ? Math.round((companiesWithContacts / totalCompanies) * 100) : 0,
        },
        regionAnalytics: regionRows
          .filter((row) => row.region || row.state)
          .map((row) => ({
            region: row.region || 'Unspecified',
            state: row.state || 'Unspecified',
            companyCount: Number(row.company_count || 0),
            plantCount: Number(row.plant_count || 0),
            contactCount: Number(row.contact_count || 0),
          })),
        serviceAnalytics: serviceGroups.map((row) => ({ serviceType: String(row.serviceType), count: Number(row._count || 0) })),
        verificationAnalytics: verificationGroups.map((row) => ({ verificationStatus: String(row.verificationStatus), count: Number(row._count || 0) })),
      };
    },
  );
}

export async function listIndustrialCompanies(filters: IndustrialCompanyFilters) {
  return industrialRead(
    { companies: [] as Array<Prisma.IndustrialCompanyGetPayload<{ select: typeof companyListSelect }>>, pagination: industrialPaginationMeta(0, filters.page, filters.limit) },
    async () => {
      const where = companyWhere(filters);
      const [total, companies] = await prisma.$transaction([
        prisma.industrialCompany.count({ where }),
        prisma.industrialCompany.findMany({
          where,
          select: companyListSelect,
          orderBy: { [filters.sort]: filters.direction },
          skip: industrialOffset(filters.page, filters.limit),
          take: filters.limit,
        }),
      ]);
      return { companies, pagination: industrialPaginationMeta(total, filters.page, filters.limit) };
    },
  );
}

export async function listIndustrialContacts(filters: IndustrialContactFilters) {
  return industrialRead(
    { contacts: [] as Array<Prisma.IndustrialContactGetPayload<{ select: typeof contactListSelect }>>, pagination: industrialPaginationMeta(0, filters.page, filters.limit) },
    async () => {
      const where = contactWhere(filters);
      const [total, contacts] = await prisma.$transaction([
        prisma.industrialContact.count({ where }),
        prisma.industrialContact.findMany({
          where,
          select: contactListSelect,
          orderBy: { [filters.sort]: filters.direction },
          skip: industrialOffset(filters.page, filters.limit),
          take: filters.limit,
        }),
      ]);
      return { contacts, pagination: industrialPaginationMeta(total, filters.page, filters.limit) };
    },
  );
}

export async function getIndustrialCompanyDetail(id: string) {
  return industrialRead(null, async () =>
    prisma.industrialCompany.findUnique({
      where: { id },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        legalName: true,
        canonicalName: true,
        displayName: true,
        normalizedName: true,
        companyType: true,
        industryCategory: true,
        subcategories: true,
        officialWebsite: true,
        officialDomain: true,
        gstin: true,
        country: true,
        region: true,
        state: true,
        city: true,
        headOfficeAddress: true,
        verificationStatus: true,
        lifecycleStatus: true,
        researchStatus: true,
        priority: true,
        opportunityScore: true,
        isActive: true,
        notes: true,
        plants: {
          select: {
            id: true,
            plantName: true,
            plantType: true,
            region: true,
            state: true,
            district: true,
            city: true,
            industrialCluster: true,
            industrialArea: true,
            capacityScale: true,
            verificationStatus: true,
            opportunityScore: true,
          },
          orderBy: { updatedAt: 'desc' },
          take: 25,
        },
        contacts: {
          select: {
            id: true,
            personName: true,
            designation: true,
            department: true,
            phone: true,
            email: true,
            verificationStatus: true,
            plant: { select: { id: true, plantName: true } },
          },
          orderBy: { updatedAt: 'desc' },
          take: 25,
        },
        capabilities: {
          select: {
            id: true,
            capabilityType: true,
            industryCategory: true,
            subcategory: true,
            processName: true,
            product: true,
            material: true,
            capacityText: true,
            verificationStatus: true,
            plant: { select: { id: true, plantName: true } },
          },
          orderBy: { updatedAt: 'desc' },
          take: 25,
        },
        serviceOpportunities: {
          select: {
            id: true,
            serviceType: true,
            fitLevel: true,
            score: true,
            status: true,
            reason: true,
            evidence: true,
            verificationStatus: true,
            plant: { select: { id: true, plantName: true } },
          },
          orderBy: [{ score: 'desc' }, { updatedAt: 'desc' }],
          take: 25,
        },
        sources: {
          select: {
            id: true,
            sourceType: true,
            sourceUrl: true,
            sourceTitle: true,
            verificationLevel: true,
            verificationSource: true,
            researchDate: true,
            capturedAt: true,
            notes: true,
          },
          orderBy: { capturedAt: 'desc' },
          take: 25,
        },
        assignments: {
          select: {
            id: true,
            assignedTo: true,
            assignedBy: true,
            status: true,
            purpose: true,
            dueAt: true,
            notes: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            plants: true,
            contacts: true,
            capabilities: true,
            serviceOpportunities: true,
            sources: true,
          },
        },
      },
    }),
  );
}

export async function getIndustrialPlantDetail(id: string) {
  return industrialRead(null, async () =>
    prisma.industrialPlant.findUnique({
      where: { id },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        plantName: true,
        plantCode: true,
        plantType: true,
        country: true,
        region: true,
        state: true,
        district: true,
        city: true,
        industrialCluster: true,
        industrialArea: true,
        address: true,
        pincode: true,
        latitude: true,
        longitude: true,
        capacityScale: true,
        verificationStatus: true,
        lifecycleStatus: true,
        opportunityScore: true,
        notes: true,
        company: {
          select: {
            id: true,
            canonicalName: true,
            industryCategory: true,
            priority: true,
            verificationStatus: true,
          },
        },
        contacts: {
          select: {
            id: true,
            personName: true,
            designation: true,
            department: true,
            phone: true,
            email: true,
            verificationStatus: true,
          },
          orderBy: { updatedAt: 'desc' },
          take: 25,
        },
        capabilities: {
          select: {
            id: true,
            capabilityType: true,
            processName: true,
            product: true,
            material: true,
            capacityText: true,
            verificationStatus: true,
          },
          orderBy: { updatedAt: 'desc' },
          take: 25,
        },
        serviceOpportunities: {
          select: {
            id: true,
            serviceType: true,
            fitLevel: true,
            score: true,
            status: true,
            reason: true,
            evidence: true,
            verificationStatus: true,
          },
          orderBy: [{ score: 'desc' }, { updatedAt: 'desc' }],
          take: 25,
        },
        sources: {
          select: {
            id: true,
            sourceType: true,
            sourceUrl: true,
            sourceTitle: true,
            verificationLevel: true,
            verificationSource: true,
            researchDate: true,
            capturedAt: true,
            notes: true,
          },
          orderBy: { capturedAt: 'desc' },
          take: 25,
        },
        _count: {
          select: {
            contacts: true,
            capabilities: true,
            serviceOpportunities: true,
            sources: true,
          },
        },
      },
    }),
  );
}
