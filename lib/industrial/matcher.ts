import { Prisma } from '@prisma/client';
import { prisma, hasDatabaseConnection } from '@/lib/proDb';
import {
  analyzeCompanyDuplicate,
  analyzeContactDuplicate,
  analyzePlantDuplicate,
  rankDuplicateAnalyses,
} from './duplicates';
import { NormalizedIndustrialCandidateInput } from './types';

const maxMatcherCandidates = 25;

const companySelect = {
  id: true,
  canonicalName: true,
  normalizedName: true,
  officialDomain: true,
  gstin: true,
  state: true,
  city: true,
  headOfficeAddress: true,
} satisfies Prisma.IndustrialCompanySelect;

const plantSelect = {
  id: true,
  companyId: true,
  plantName: true,
  plantCode: true,
  normalizedPlantName: true,
  state: true,
  city: true,
  industrialCluster: true,
  industrialArea: true,
  normalizedAddress: true,
  pincode: true,
  company: {
    select: {
      id: true,
      normalizedName: true,
      canonicalName: true,
    },
  },
} satisfies Prisma.IndustrialPlantSelect;

const contactSelect = {
  id: true,
  companyId: true,
  plantId: true,
  normalizedPhone: true,
  normalizedWhatsapp: true,
  normalizedEmail: true,
  department: true,
  normalizedPersonName: true,
} satisfies Prisma.IndustrialContactSelect;

function uniqueWhere(where: Prisma.IndustrialCompanyWhereInput[]) {
  return where.filter((item, index) => JSON.stringify(item) && where.findIndex((candidate) => JSON.stringify(candidate) === JSON.stringify(item)) === index);
}

export async function findIndustrialDuplicateCandidates(input: NormalizedIndustrialCandidateInput) {
  if (!hasDatabaseConnection()) {
    return { schemaReady: false, companyCandidates: [], plantCandidates: [], contactCandidates: [] };
  }

  const companyName = input.company.companyName.normalized;
  const companyFilters: Prisma.IndustrialCompanyWhereInput[] = [];
  if (input.company.gstin?.valid) companyFilters.push({ gstin: input.company.gstin.normalized });
  if (input.company.officialDomain?.valid) companyFilters.push({ officialDomain: input.company.officialDomain.normalized });
  if (companyName) companyFilters.push({ normalizedName: companyName });
  if (companyName && input.company.location?.city?.normalized) {
    companyFilters.push({ normalizedName: companyName, city: { equals: input.company.location.city.normalized, mode: Prisma.QueryMode.insensitive } });
  }
  if (companyName && input.company.location?.state?.normalized) {
    companyFilters.push({ normalizedName: companyName, state: { equals: input.company.location.state.normalized, mode: Prisma.QueryMode.insensitive } });
  }

  const companies = companyFilters.length
    ? await prisma.industrialCompany.findMany({
        where: { OR: uniqueWhere(companyFilters) },
        select: companySelect,
        orderBy: { updatedAt: 'desc' },
        take: maxMatcherCandidates,
      })
    : [];

  const matchedCompanyIds = companies.map((company) => company.id);
  const plantFilters: Prisma.IndustrialPlantWhereInput[] = [];
  const plantName = input.plant?.plantName?.normalized;
  if (matchedCompanyIds.length) plantFilters.push({ companyId: { in: matchedCompanyIds } });
  if (matchedCompanyIds.length && plantName) plantFilters.push({ companyId: { in: matchedCompanyIds }, normalizedPlantName: plantName });
  if (matchedCompanyIds.length && input.plant?.location?.city?.normalized) {
    plantFilters.push({ companyId: { in: matchedCompanyIds }, city: { equals: input.plant.location.city.normalized, mode: Prisma.QueryMode.insensitive } });
  }
  if (matchedCompanyIds.length && input.plant?.location?.pincode?.valid) {
    plantFilters.push({ companyId: { in: matchedCompanyIds }, pincode: input.plant.location.pincode.normalized });
  }

  const plants = plantFilters.length
    ? await prisma.industrialPlant.findMany({
        where: { OR: plantFilters },
        select: plantSelect,
        orderBy: { updatedAt: 'desc' },
        take: maxMatcherCandidates,
      })
    : [];

  const contactFilters: Prisma.IndustrialContactWhereInput[] = [];
  if (input.contact?.phone?.valid) contactFilters.push({ normalizedPhone: input.contact.phone.normalized });
  if (input.contact?.whatsapp?.valid) contactFilters.push({ normalizedWhatsapp: input.contact.whatsapp.normalized });
  if (input.contact?.email?.valid) contactFilters.push({ normalizedEmail: input.contact.email.normalized });

  const contacts = contactFilters.length
    ? await prisma.industrialContact.findMany({
        where: { OR: contactFilters },
        select: contactSelect,
        orderBy: { updatedAt: 'desc' },
        take: maxMatcherCandidates,
      })
    : [];

  return {
    schemaReady: true,
    companyCandidates: rankDuplicateAnalyses(companies.map((company) => analyzeCompanyDuplicate(input, company))),
    plantCandidates: rankDuplicateAnalyses(plants.map((plant) => analyzePlantDuplicate(input, plant))),
    contactCandidates: rankDuplicateAnalyses(contacts.map((contact) => analyzeContactDuplicate(input, contact))),
  };
}

