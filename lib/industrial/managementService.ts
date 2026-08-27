import { randomUUID } from 'crypto';
import {
  IndustrialIndustryCategory,
  IndustrialLifecycleStatus,
  IndustrialPriority,
  IndustrialServiceType,
  IndustrialSourceType,
  IndustrialVerificationStatus,
  Prisma,
} from '@prisma/client';
import { prisma } from '@/lib/proDb';
import { auditIndustrialAction } from '@/lib/security/industrialAudit';
import { normalizeAddressText } from './text';
import {
  normalizeCompanyName,
  normalizeDepartment,
  normalizeDesignation,
  normalizeEmail,
  normalizeGstin,
  normalizeLocation,
  normalizeOfficialDomain,
  normalizePersonName,
  normalizePhone,
  normalizeProcessLabel,
  normalizeServiceOpportunity,
} from './normalization';
import { findIndustrialDuplicateCandidates } from './matcher';
import type { NormalizedIndustrialCandidateInput } from './types';

type DuplicateDecision = {
  useExistingId?: string;
  createAnywayJustification?: string;
};

type ManualResult<T> =
  | { status: 'CREATED' | 'UPDATED' | 'USED_EXISTING'; record: T }
  | { status: 'DUPLICATE_REVIEW_REQUIRED'; candidates: Array<Record<string, unknown>> };

const verificationRank: Record<IndustrialVerificationStatus, number> = {
  UNVERIFIED: 0,
  DISCOVERY_ONLY: 1,
  SOURCE_CAPTURED: 2,
  AUTO_NORMALIZED: 3,
  NEEDS_REVIEW: 4,
  PARTIALLY_VERIFIED: 5,
  ASSOCIATION_VERIFIED: 6,
  REGULATORY_VERIFIED: 7,
  OFFICIAL_VERIFIED: 8,
  MANUALLY_VERIFIED: 8,
  VERIFIED: 9,
  CONFLICTING: 4,
  STALE: 3,
  REJECTED: 0,
};

function text(value: unknown, max = 500) {
  return String(value || '').trim().slice(0, max);
}

function numberScore(value: unknown) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 0;
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  const candidate = String(value || '').trim().toUpperCase();
  return allowed.includes(candidate as T) ? (candidate as T) : fallback;
}

function parseIndustry(value: unknown): IndustrialIndustryCategory {
  const label = `${value || ''}`.toLowerCase();
  if (/forg/.test(label)) return 'FORGING';
  if (/steel|rolling|furnace|billet|ingot|dri/.test(label)) return 'STEEL';
  return 'OTHER_MANUFACTURING';
}

function parsePriority(value: unknown): IndustrialPriority {
  return enumValue(value, ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const, 'MEDIUM');
}

function parseVerification(value: unknown, fallback: IndustrialVerificationStatus): IndustrialVerificationStatus {
  return enumValue(
    value,
    [
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
    ] as const,
    fallback,
  );
}

function parseLifecycle(value: unknown, fallback: IndustrialLifecycleStatus): IndustrialLifecycleStatus {
  return enumValue(
    value,
    ['DISCOVERED', 'VERIFICATION_PENDING', 'VERIFIED', 'QUALIFIED', 'OUTREACH_READY', 'CONTACTED', 'ENGAGED', 'CRM_PROMOTED', 'OPPORTUNITY', 'QUOTATION', 'CUSTOMER', 'DISQUALIFIED'] as const,
    fallback,
  );
}

function parseSourceType(value: unknown): IndustrialSourceType {
  const label = `${value || ''}`.toLowerCase();
  if (/official|website/.test(label)) return 'OFFICIAL_WEBSITE';
  if (/government/.test(label)) return 'GOVERNMENT';
  if (/spcb|ocmms/.test(label)) return 'SPCB_OCMMS';
  if (/aifi\b/.test(label)) return 'AIFI';
  if (/aiifa\b/.test(label)) return 'AIIFA';
  if (/\bjpc\b/.test(label)) return 'JPC';
  if (/association/.test(label)) return 'INDUSTRY_ASSOCIATION';
  if (/google|maps/.test(label)) return 'GOOGLE_MAPS';
  if (/indiamart/.test(label)) return 'INDIAMART';
  if (/tradeindia/.test(label)) return 'TRADEINDIA';
  if (/phone|crm/.test(label)) return 'EXISTING_PHONE_CRM';
  if (/manual|research|referral/.test(label)) return 'MANUAL_RESEARCH';
  return 'OTHER';
}

function preserveVerification(current: IndustrialVerificationStatus, next: IndustrialVerificationStatus, justification?: string) {
  if (verificationRank[next] < verificationRank[current] && !text(justification, 1000)) {
    throw new Error('VERIFICATION_DOWNGRADE_REQUIRES_JUSTIFICATION');
  }
  return next;
}

function compactDuplicateCandidates(result: Awaited<ReturnType<typeof findIndustrialDuplicateCandidates>>) {
  return [...result.companyCandidates, ...result.plantCandidates, ...result.contactCandidates]
    .filter((candidate) => candidate.recommendedDisposition !== 'NO_MATCH')
    .slice(0, 10)
    .map((candidate) => ({
      candidateType: candidate.candidateType,
      existingEntityId: (candidate.entityB as { id?: string }).id,
      score: candidate.score,
      confidence: candidate.confidence,
      recommendedDisposition: candidate.recommendedDisposition,
      signals: candidate.signals.map((signal) => signal.key),
      conflicts: candidate.conflicts.map((conflict) => conflict.key),
    }));
}

async function assertDuplicateDecision(candidate: NormalizedIndustrialCandidateInput, decision: DuplicateDecision | undefined) {
  const matches = await findIndustrialDuplicateCandidates(candidate);
  const candidates = compactDuplicateCandidates(matches);
  if (!candidates.length) return { matches, candidates };
  if (decision?.useExistingId) return { matches, candidates };
  if (text(decision?.createAnywayJustification, 1000)) return { matches, candidates };
  return { matches, candidates, blocked: true };
}

export async function createManualIndustrialCompany(input: Record<string, unknown>, actor: string): Promise<ManualResult<{ id: string }>> {
  const companyName = normalizeCompanyName(text(input.companyName || input.canonicalName || input.legalName, 250));
  if (!companyName.normalized) throw new Error('COMPANY_NAME_REQUIRED');
  const domain = text(input.officialWebsite || input.officialDomain) ? normalizeOfficialDomain(text(input.officialWebsite || input.officialDomain, 250)) : undefined;
  const gstin = text(input.gstin) ? normalizeGstin(text(input.gstin, 32)) : undefined;
  const location = normalizeLocation({
    country: text(input.country, 80) || 'India',
    region: text(input.region, 80),
    state: text(input.state, 80),
    city: text(input.city, 80),
    address: text(input.headOfficeAddress || input.address, 1000),
  });
  const industryCategory = parseIndustry(input.industryCategory || input.industry);
  const candidate: NormalizedIndustrialCandidateInput = {
    company: {
      originalName: companyName.original,
      companyName,
      officialDomain: domain,
      gstin,
      location,
      industryCategory,
      processLabels: [],
    },
  };
  const decision = {
    useExistingId: text(input.useExistingCompanyId, 80) || undefined,
    createAnywayJustification: text(input.createAnywayJustification, 1000) || undefined,
  };
  const duplicate = await assertDuplicateDecision(candidate, decision);
  if (duplicate.blocked) return { status: 'DUPLICATE_REVIEW_REQUIRED', candidates: duplicate.candidates };
  if (decision.useExistingId) {
    await auditIndustrialAction({ actor, action: 'INDUSTRIAL_COMPANY_USE_EXISTING', entity: 'IndustrialCompany', entityId: decision.useExistingId, raw: { duplicateCandidates: duplicate.candidates.length } });
    return { status: 'USED_EXISTING', record: { id: decision.useExistingId } };
  }
  const record = await prisma.industrialCompany.create({
    data: {
      id: `IC-${randomUUID()}`,
      canonicalName: companyName.displayName,
      displayName: companyName.displayName,
      legalName: text(input.legalName, 250) || companyName.original,
      normalizedName: companyName.normalized,
      officialWebsite: domain?.original || null,
      officialDomain: domain?.valid ? domain.normalized : null,
      gstin: gstin?.valid ? gstin.normalized : null,
      country: location.country?.normalized || 'India',
      region: location.region?.normalized || null,
      state: location.state?.normalized || null,
      city: location.city?.normalized || null,
      headOfficeAddress: location.address?.original || null,
      industryCategory,
      verificationStatus: parseVerification(input.verificationStatus, 'SOURCE_CAPTURED'),
      lifecycleStatus: parseLifecycle(input.lifecycleStatus, 'VERIFICATION_PENDING'),
      researchStatus: text(input.researchStatus, 80) || 'MANUAL_CREATE',
      priority: parsePriority(input.priority),
      opportunityScore: numberScore(input.opportunityScore),
      notes: text(input.notes, 2000) || null,
      raw: { manualCreate: true, duplicateOverrideJustification: decision.createAnywayJustification || null } as Prisma.InputJsonValue,
    },
    select: { id: true },
  });
  await auditIndustrialAction({ actor, action: 'INDUSTRIAL_COMPANY_CREATED', entity: 'IndustrialCompany', entityId: record.id, companyId: record.id, raw: { duplicateOverride: Boolean(decision.createAnywayJustification) } });
  return { status: 'CREATED', record };
}

export async function updateManualIndustrialCompany(id: string, input: Record<string, unknown>, actor: string) {
  const current = await prisma.industrialCompany.findUnique({ where: { id }, select: { id: true, verificationStatus: true } });
  if (!current) throw new Error('INDUSTRIAL_COMPANY_NOT_FOUND');
  const companyName = text(input.companyName || input.canonicalName, 250) ? normalizeCompanyName(text(input.companyName || input.canonicalName, 250)) : null;
  const domain = text(input.officialWebsite || input.officialDomain) ? normalizeOfficialDomain(text(input.officialWebsite || input.officialDomain, 250)) : null;
  const gstin = text(input.gstin) ? normalizeGstin(text(input.gstin, 32)) : null;
  const location = normalizeLocation({ region: text(input.region, 80), state: text(input.state, 80), city: text(input.city, 80), address: text(input.headOfficeAddress || input.address, 1000) });
  const nextVerification = input.verificationStatus ? preserveVerification(current.verificationStatus, parseVerification(input.verificationStatus, current.verificationStatus), text(input.justification, 1000)) : current.verificationStatus;
  const record = await prisma.industrialCompany.update({
    where: { id },
    data: {
      ...(companyName ? { canonicalName: companyName.displayName, displayName: companyName.displayName, normalizedName: companyName.normalized } : {}),
      ...(input.legalName !== undefined ? { legalName: text(input.legalName, 250) || null } : {}),
      ...(domain ? { officialWebsite: domain.original, officialDomain: domain.valid ? domain.normalized : null } : {}),
      ...(gstin ? { gstin: gstin.valid ? gstin.normalized : null } : {}),
      ...(location.region ? { region: location.region.normalized } : {}),
      ...(location.state ? { state: location.state.normalized } : {}),
      ...(location.city ? { city: location.city.normalized } : {}),
      ...(location.address ? { headOfficeAddress: location.address.original } : {}),
      ...(input.industryCategory || input.industry ? { industryCategory: parseIndustry(input.industryCategory || input.industry) } : {}),
      verificationStatus: nextVerification,
      ...(input.lifecycleStatus ? { lifecycleStatus: parseLifecycle(input.lifecycleStatus, 'VERIFICATION_PENDING') } : {}),
      ...(input.priority ? { priority: parsePriority(input.priority) } : {}),
      ...(input.opportunityScore !== undefined ? { opportunityScore: numberScore(input.opportunityScore) } : {}),
      ...(input.notes !== undefined ? { notes: text(input.notes, 2000) || null } : {}),
    },
    select: { id: true },
  });
  await auditIndustrialAction({ actor, action: 'INDUSTRIAL_COMPANY_UPDATED', entity: 'IndustrialCompany', entityId: id, companyId: id, raw: { verificationStatus: nextVerification, justification: text(input.justification, 1000) || undefined } });
  return { status: 'UPDATED' as const, record };
}

export async function createManualIndustrialPlant(companyId: string, input: Record<string, unknown>, actor: string): Promise<ManualResult<{ id: string }>> {
  const company = await prisma.industrialCompany.findUnique({ where: { id: companyId }, select: { id: true, canonicalName: true, normalizedName: true, industryCategory: true } });
  if (!company) throw new Error('INDUSTRIAL_COMPANY_NOT_FOUND');
  const plantName = normalizeCompanyName(text(input.plantName, 250) || company.canonicalName);
  const location = normalizeLocation({
    region: text(input.region, 80),
    state: text(input.state, 80),
    district: text(input.district, 80),
    city: text(input.city, 80),
    industrialCluster: text(input.industrialCluster, 120),
    industrialArea: text(input.industrialArea, 120),
    pincode: text(input.pincode, 20),
    address: text(input.address || input.plantAddress, 1000),
  });
  const candidate: NormalizedIndustrialCandidateInput = {
    company: { originalName: company.canonicalName, companyName: { original: company.canonicalName, displayName: company.canonicalName, normalized: company.normalizedName }, location, industryCategory: company.industryCategory, processLabels: [] },
    plant: { companyName: { original: company.canonicalName, displayName: company.canonicalName, normalized: company.normalizedName }, plantName, plantCode: text(input.plantCode, 80) || undefined, location, processLabels: [] },
  };
  const duplicate = await assertDuplicateDecision(candidate, { useExistingId: text(input.useExistingPlantId, 80) || undefined, createAnywayJustification: text(input.createAnywayJustification, 1000) || undefined });
  if (duplicate.blocked) return { status: 'DUPLICATE_REVIEW_REQUIRED', candidates: duplicate.candidates };
  if (text(input.useExistingPlantId, 80)) return { status: 'USED_EXISTING', record: { id: text(input.useExistingPlantId, 80) } };
  const record = await prisma.industrialPlant.create({
    data: {
      id: `IP-${randomUUID()}`,
      companyId,
      plantName: plantName.displayName,
      normalizedPlantName: plantName.normalized,
      plantCode: text(input.plantCode, 80) || null,
      plantType: text(input.plantType, 120) || null,
      region: location.region?.normalized || null,
      state: location.state?.normalized || null,
      district: location.district?.normalized || null,
      city: location.city?.normalized || null,
      industrialCluster: location.industrialCluster?.normalized || null,
      industrialArea: location.industrialArea?.normalized || null,
      address: location.address?.original || null,
      normalizedAddress: location.address?.normalized || (location.address?.original ? normalizeAddressText(location.address.original) : null),
      pincode: location.pincode?.valid ? location.pincode.normalized : null,
      capacityScale: text(input.capacityScale, 120) || null,
      verificationStatus: parseVerification(input.verificationStatus, 'SOURCE_CAPTURED'),
      lifecycleStatus: parseLifecycle(input.lifecycleStatus, 'VERIFICATION_PENDING'),
      opportunityScore: numberScore(input.opportunityScore),
      notes: text(input.notes, 2000) || null,
      raw: { manualCreate: true, duplicateOverrideJustification: text(input.createAnywayJustification, 1000) || null } as Prisma.InputJsonValue,
    },
    select: { id: true },
  });
  await auditIndustrialAction({ actor, action: 'INDUSTRIAL_PLANT_CREATED', entity: 'IndustrialPlant', entityId: record.id, companyId, plantId: record.id });
  return { status: 'CREATED', record };
}

export async function updateManualIndustrialPlant(id: string, input: Record<string, unknown>, actor: string) {
  const current = await prisma.industrialPlant.findUnique({ where: { id }, select: { id: true, companyId: true, verificationStatus: true } });
  if (!current) throw new Error('INDUSTRIAL_PLANT_NOT_FOUND');
  const plantName = text(input.plantName, 250) ? normalizeCompanyName(text(input.plantName, 250)) : null;
  const location = normalizeLocation({ state: text(input.state, 80), district: text(input.district, 80), city: text(input.city, 80), industrialCluster: text(input.industrialCluster, 120), industrialArea: text(input.industrialArea, 120), pincode: text(input.pincode, 20), address: text(input.address || input.plantAddress, 1000) });
  const nextVerification = input.verificationStatus ? preserveVerification(current.verificationStatus, parseVerification(input.verificationStatus, current.verificationStatus), text(input.justification, 1000)) : current.verificationStatus;
  const record = await prisma.industrialPlant.update({
    where: { id },
    data: {
      ...(plantName ? { plantName: plantName.displayName, normalizedPlantName: plantName.normalized } : {}),
      ...(input.plantCode !== undefined ? { plantCode: text(input.plantCode, 80) || null } : {}),
      ...(input.plantType !== undefined ? { plantType: text(input.plantType, 120) || null } : {}),
      ...(location.state ? { state: location.state.normalized } : {}),
      ...(location.district ? { district: location.district.normalized } : {}),
      ...(location.city ? { city: location.city.normalized } : {}),
      ...(location.industrialCluster ? { industrialCluster: location.industrialCluster.normalized } : {}),
      ...(location.industrialArea ? { industrialArea: location.industrialArea.normalized } : {}),
      ...(location.address ? { address: location.address.original, normalizedAddress: location.address.normalized } : {}),
      ...(location.pincode ? { pincode: location.pincode.valid ? location.pincode.normalized : null } : {}),
      ...(input.capacityScale !== undefined ? { capacityScale: text(input.capacityScale, 120) || null } : {}),
      verificationStatus: nextVerification,
      ...(input.lifecycleStatus ? { lifecycleStatus: parseLifecycle(input.lifecycleStatus, 'VERIFICATION_PENDING') } : {}),
      ...(input.opportunityScore !== undefined ? { opportunityScore: numberScore(input.opportunityScore) } : {}),
      ...(input.notes !== undefined ? { notes: text(input.notes, 2000) || null } : {}),
    },
    select: { id: true },
  });
  await auditIndustrialAction({ actor, action: 'INDUSTRIAL_PLANT_UPDATED', entity: 'IndustrialPlant', entityId: id, companyId: current.companyId, plantId: id });
  return { status: 'UPDATED' as const, record };
}

export async function createManualIndustrialContact(input: Record<string, unknown>, actor: string): Promise<ManualResult<{ id: string }>> {
  const companyId = text(input.companyId, 80);
  const company = await prisma.industrialCompany.findUnique({ where: { id: companyId }, select: { id: true, canonicalName: true, normalizedName: true, industryCategory: true } });
  if (!company) throw new Error('INDUSTRIAL_COMPANY_NOT_FOUND');
  const plant = text(input.plantId, 80) ? await prisma.industrialPlant.findFirst({ where: { id: text(input.plantId, 80), companyId }, select: { id: true, plantName: true, normalizedPlantName: true } }) : null;
  if (text(input.plantId, 80) && !plant) throw new Error('INDUSTRIAL_PLANT_NOT_FOUND');
  const phone = text(input.phone, 80) ? normalizePhone(text(input.phone, 80)) : undefined;
  const whatsapp = text(input.whatsapp, 80) ? normalizePhone(text(input.whatsapp, 80)) : undefined;
  const email = text(input.email, 250) ? normalizeEmail(text(input.email, 250)) : undefined;
  const candidate: NormalizedIndustrialCandidateInput = {
    company: { originalName: company.canonicalName, companyName: { original: company.canonicalName, displayName: company.canonicalName, normalized: company.normalizedName }, industryCategory: company.industryCategory, processLabels: [] },
    contact: {
      companyName: { original: company.canonicalName, displayName: company.canonicalName, normalized: company.normalizedName },
      plantName: plant ? { original: plant.plantName, displayName: plant.plantName, normalized: plant.normalizedPlantName } : undefined,
      personName: text(input.personName, 160) ? normalizePersonName(text(input.personName, 160)) : undefined,
      designation: text(input.designation, 160) ? normalizeDesignation(text(input.designation, 160)) : undefined,
      department: text(input.department, 120) ? normalizeDepartment(text(input.department, 120)) : undefined,
      phone,
      whatsapp,
      email,
    },
  };
  const duplicate = await assertDuplicateDecision(candidate, { useExistingId: text(input.useExistingContactId, 80) || undefined, createAnywayJustification: text(input.createAnywayJustification, 1000) || undefined });
  if (duplicate.blocked) return { status: 'DUPLICATE_REVIEW_REQUIRED', candidates: duplicate.candidates };
  if (text(input.useExistingContactId, 80)) return { status: 'USED_EXISTING', record: { id: text(input.useExistingContactId, 80) } };
  const record = await prisma.industrialContact.create({
    data: {
      id: `ICT-${randomUUID()}`,
      companyId,
      plantId: plant?.id || null,
      personName: candidate.contact?.personName?.original || null,
      normalizedPersonName: candidate.contact?.personName?.normalized || null,
      designation: candidate.contact?.designation?.original || null,
      department: candidate.contact?.department?.normalized || null,
      phone: phone?.original || null,
      normalizedPhone: phone?.valid ? phone.normalized : null,
      whatsapp: whatsapp?.original || null,
      normalizedWhatsapp: whatsapp?.valid ? whatsapp.normalized : null,
      email: email?.original || null,
      normalizedEmail: email?.valid ? email.normalized : null,
      contactScope: plant ? 'PLANT_SPECIFIC' : 'COMPANY_LEVEL',
      verificationStatus: parseVerification(input.verificationStatus || input.verification, 'SOURCE_CAPTURED'),
      consentStatus: text(input.consentStatus, 80) || 'unknown',
      notes: text(input.notes, 2000) || null,
      raw: { source: text(input.source, 250) || null, manualCreate: true, duplicateOverrideJustification: text(input.createAnywayJustification, 1000) || null } as Prisma.InputJsonValue,
    },
    select: { id: true },
  });
  await auditIndustrialAction({ actor, action: 'INDUSTRIAL_CONTACT_CREATED', entity: 'IndustrialContact', entityId: record.id, companyId, plantId: plant?.id, contactId: record.id });
  return { status: 'CREATED', record };
}

export async function updateManualIndustrialContact(id: string, input: Record<string, unknown>, actor: string) {
  const current = await prisma.industrialContact.findUnique({ where: { id }, select: { id: true, companyId: true, plantId: true, verificationStatus: true } });
  if (!current) throw new Error('INDUSTRIAL_CONTACT_NOT_FOUND');
  const phone = text(input.phone, 80) ? normalizePhone(text(input.phone, 80)) : null;
  const whatsapp = text(input.whatsapp, 80) ? normalizePhone(text(input.whatsapp, 80)) : null;
  const email = text(input.email, 250) ? normalizeEmail(text(input.email, 250)) : null;
  const nextVerification = input.verificationStatus ? preserveVerification(current.verificationStatus, parseVerification(input.verificationStatus, current.verificationStatus), text(input.justification, 1000)) : current.verificationStatus;
  const record = await prisma.industrialContact.update({
    where: { id },
    data: {
      ...(input.personName !== undefined ? { personName: text(input.personName, 160) || null, normalizedPersonName: text(input.personName, 160) ? normalizePersonName(text(input.personName, 160)).normalized : null } : {}),
      ...(input.designation !== undefined ? { designation: text(input.designation, 160) || null } : {}),
      ...(input.department !== undefined ? { department: text(input.department, 120) ? normalizeDepartment(text(input.department, 120)).normalized : null } : {}),
      ...(phone ? { phone: phone.original, normalizedPhone: phone.valid ? phone.normalized : null } : {}),
      ...(whatsapp ? { whatsapp: whatsapp.original, normalizedWhatsapp: whatsapp.valid ? whatsapp.normalized : null } : {}),
      ...(email ? { email: email.original, normalizedEmail: email.valid ? email.normalized : null } : {}),
      verificationStatus: nextVerification,
      ...(input.notes !== undefined ? { notes: text(input.notes, 2000) || null } : {}),
    },
    select: { id: true },
  });
  await auditIndustrialAction({ actor, action: 'INDUSTRIAL_CONTACT_UPDATED', entity: 'IndustrialContact', entityId: id, companyId: current.companyId, plantId: current.plantId || undefined, contactId: id });
  return { status: 'UPDATED' as const, record };
}

export async function createIndustrialResearchProspect(input: Record<string, unknown>, actor: string) {
  return createManualIndustrialCompany(
    {
      ...input,
      industryCategory: input.industryCategory || input.industry || 'OTHER_MANUFACTURING',
      verificationStatus: input.verificationStatus || 'DISCOVERY_ONLY',
      lifecycleStatus: input.lifecycleStatus || 'DISCOVERED',
      researchStatus: input.researchStatus || 'VERIFICATION_PENDING',
      sourceType: input.sourceType || 'MANUAL_RESEARCH',
    },
    actor,
  );
}

export async function addIndustrialCapability(companyId: string, input: Record<string, unknown>, actor: string) {
  const plantId = text(input.plantId, 80) || null;
  const processLabel = text(input.processName || input.process || input.capabilityType, 180);
  const process = processLabel ? normalizeProcessLabel(processLabel) : null;
  const record = await prisma.industrialCapability.create({
    data: {
      id: `ICA-${randomUUID()}`,
      companyId,
      plantId,
      capabilityType: text(input.capabilityType, 180) || processLabel || 'MANUAL_CAPABILITY',
      industryCategory: process?.industryCategory || parseIndustry(input.industryCategory || processLabel),
      subcategory: text(input.subcategory, 180) || null,
      processName: processLabel || null,
      product: text(input.product, 250) || null,
      material: text(input.material, 180) || null,
      capacityText: text(input.capacityText || input.capacity, 250) || null,
      verificationStatus: parseVerification(input.verificationStatus, 'SOURCE_CAPTURED'),
      notes: text(input.notes, 2000) || null,
      raw: { manualCreate: true } as Prisma.InputJsonValue,
    },
    select: { id: true },
  });
  await auditIndustrialAction({ actor, action: 'INDUSTRIAL_CAPABILITY_CREATED', entity: 'IndustrialCapability', entityId: record.id, companyId, plantId: plantId || undefined });
  return { status: 'CREATED' as const, record };
}

export async function addIndustrialProcess(input: Record<string, unknown>, actor: string) {
  const name = text(input.name || input.processName, 180);
  if (!name) throw new Error('PROCESS_NAME_REQUIRED');
  const normalized = normalizeProcessLabel(name);
  const record = await prisma.industrialProcess.upsert({
    where: { normalizedName: normalized.normalized },
    update: { name, industryCategory: normalized.industryCategory, status: text(input.status, 80) || 'ACTIVE' },
    create: { id: `IPR-${randomUUID()}`, name, normalizedName: normalized.normalized, industryCategory: normalized.industryCategory, status: text(input.status, 80) || 'ACTIVE' },
    select: { id: true },
  });
  await auditIndustrialAction({ actor, action: 'INDUSTRIAL_PROCESS_UPSERTED', entity: 'IndustrialProcess', entityId: record.id, raw: { name } });
  return { status: 'UPDATED' as const, record };
}

export async function addIndustrialServiceOpportunity(companyId: string, input: Record<string, unknown>, actor: string) {
  const service = normalizeServiceOpportunity(text(input.serviceType || input.opportunityType, 180));
  const record = await prisma.industrialServiceOpportunity.create({
    data: {
      id: `ISO-${randomUUID()}`,
      companyId,
      plantId: text(input.plantId, 80) || null,
      serviceType: service.normalized as IndustrialServiceType,
      fitLevel: parsePriority(input.fitLevel || input.priority),
      score: numberScore(input.score || input.opportunityScore),
      status: enumValue(String(input.status || '').toUpperCase(), ['IDENTIFIED', 'NEEDS_VERIFICATION', 'VERIFIED_FIT', 'QUALIFIED', 'OUTREACH_READY', 'CONTACTED', 'ENGAGED', 'DISQUALIFIED'] as const, 'IDENTIFIED'),
      reason: text(input.reason, 500) || null,
      evidence: text(input.evidence, 1000) || null,
      estimatedNeed: text(input.estimatedNeed, 500) || null,
      verificationStatus: parseVerification(input.verificationStatus, 'SOURCE_CAPTURED'),
      ownerAdminId: text(input.ownerAdminId, 120) || null,
      notes: text(input.notes, 2000) || null,
      raw: { manualCreate: true, sourceLabel: service.sourceLabel } as Prisma.InputJsonValue,
    },
    select: { id: true },
  });
  await auditIndustrialAction({ actor, action: 'INDUSTRIAL_SERVICE_OPPORTUNITY_CREATED', entity: 'IndustrialServiceOpportunity', entityId: record.id, companyId, serviceOpportunityId: record.id });
  return { status: 'CREATED' as const, record };
}

export async function addIndustrialSource(companyId: string, input: Record<string, unknown>, actor: string) {
  const sourceUrl = text(input.sourceUrl || input.url, 500);
  const domain = sourceUrl ? normalizeOfficialDomain(sourceUrl) : null;
  const record = await prisma.industrialSource.create({
    data: {
      id: `ISRC-${randomUUID()}`,
      companyId,
      plantId: text(input.plantId, 80) || null,
      contactId: text(input.contactId, 80) || null,
      capabilityId: text(input.capabilityId, 80) || null,
      serviceOpportunityId: text(input.serviceOpportunityId, 80) || null,
      sourceType: parseSourceType(input.sourceType),
      sourceUrl: sourceUrl || null,
      sourceTitle: text(input.sourceTitle || input.title, 250) || null,
      sourceDomain: domain?.valid ? domain.normalized : null,
      verificationLevel: parseVerification(input.verificationLevel || input.verificationStatus, 'SOURCE_CAPTURED'),
      verificationSource: Boolean(input.verificationSource),
      notes: text(input.notes, 2000) || null,
      raw: { manualCreate: true } as Prisma.InputJsonValue,
    },
    select: { id: true },
  });
  await auditIndustrialAction({ actor, action: 'INDUSTRIAL_SOURCE_CREATED', entity: 'IndustrialSource', entityId: record.id, companyId, plantId: text(input.plantId, 80) || undefined });
  return { status: 'CREATED' as const, record };
}
